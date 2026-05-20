import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { IChurch, IGroup, IChurchMember, IGroupRequest } from '../../models/church.model';

@Injectable({ providedIn: 'root' })
export class ChurchService {
  constructor(private supabase: SupabaseService) {}

  async getApprovedChurches(): Promise<IChurch[]> {
    const { data, error } = await this.supabase.client
      .from('churches')
      .select('*')
      .eq('status', 'approved')
      .order('name');
    if (error) throw error;
    return data as IChurch[];
  }

  async getChurchById(id: string): Promise<IChurch> {
    const { data, error } = await this.supabase.client
      .from('churches')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as IChurch;
  }

  async registerChurch(payload: Pick<IChurch, 'name' | 'description' | 'photo_url'>, adminId: string): Promise<IChurch> {
    const { data, error } = await this.supabase.client
      .from('churches')
      .insert({ ...payload, admin_id: adminId, status: 'pending' })
      .select()
      .single();
    if (error) throw error;
    return data as IChurch;
  }

  async getGroups(churchId: string): Promise<IGroup[]> {
    const { data, error } = await this.supabase.client
      .from('groups')
      .select('*')
      .eq('church_id', churchId)
      .order('name');
    if (error) throw error;
    return data as IGroup[];
  }

  async createGroup(name: string, churchId: string): Promise<IGroup> {
    const { data, error } = await this.supabase.client
      .from('groups')
      .insert({ name, church_id: churchId })
      .select()
      .single();
    if (error) throw error;
    return data as IGroup;
  }

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('groups')
      .delete()
      .eq('id', groupId);
    if (error) throw error;
  }

  async reRequestJoin(memberId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('church_members')
      .update({ status: 'pending' })
      .eq('id', memberId);
    if (error) throw error;
  }

  async requestJoin(userId: string, churchId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('church_members')
      .insert({ user_id: userId, church_id: churchId, status: 'pending' });
    if (error) throw error;
  }

  async getMembershipStatus(userId: string, churchId: string): Promise<IChurchMember | null> {
    const { data } = await this.supabase.client
      .from('church_members')
      .select('*')
      .eq('user_id', userId)
      .eq('church_id', churchId)
      .maybeSingle();
    return data as IChurchMember | null;
  }

  async getPendingMembers(churchId: string): Promise<IChurchMember[]> {
    return this.getMembersWithProfiles(churchId, 'pending');
  }

  async getApprovedMembers(churchId: string): Promise<IChurchMember[]> {
    return this.getMembersWithProfiles(churchId, 'approved');
  }

  private async getMembersWithProfiles(
    churchId: string,
    status: 'pending' | 'approved'
  ): Promise<IChurchMember[]> {
    const { data: members, error } = await this.supabase.client
      .from('church_members')
      .select('*')
      .eq('church_id', churchId)
      .eq('status', status)
      .order('created_at');
    if (error) throw error;
    if (!members?.length) return [];

    const userIds = members.map((m: any) => m.user_id);
    const { data: profiles } = await this.supabase.client
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    return members.map((m: any) => ({
      ...m,
      profiles: profileMap.get(m.user_id) ?? null,
    })) as IChurchMember[];
  }

  async approveMember(memberId: string, userId: string, churchId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('approve_church_member', {
      p_member_id: memberId,
      p_user_id:   userId,
      p_church_id: churchId,
    });
    if (error) throw error;
  }

  async rejectMember(memberId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('church_members')
      .delete()
      .eq('id', memberId);
    if (error) throw error;
  }

  async assignGroup(memberId: string, groupId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('assign_member_group', {
      p_member_id: memberId,
      p_group_id:  groupId || null,
      p_user_id:   userId,
    });
    if (error) throw error;
  }

  async updateChurch(churchId: string, payload: Pick<IChurch, 'name' | 'description'>): Promise<void> {
    const { error } = await this.supabase.client
      .from('churches')
      .update(payload)
      .eq('id', churchId);
    if (error) throw error;
  }

  async leaveChurch(memberId: string, userId: string): Promise<void> {
    const { error: memberError } = await this.supabase.client
      .from('church_members')
      .delete()
      .eq('id', memberId);
    if (memberError) throw memberError;

    const { error: profileError } = await this.supabase.client
      .from('profiles')
      .update({ church_id: null, group_id: null })
      .eq('id', userId);
    if (profileError) throw profileError;
  }

  async removeMember(memberId: string, userId: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('remove_church_member', {
      p_member_id: memberId,
      p_user_id:   userId,
    });
    if (error) throw error;
  }

  async getMyGroupRequest(userId: string, churchId: string): Promise<IGroupRequest | null> {
    const { data } = await this.supabase.client
      .from('group_requests')
      .select('*, groups(name)')
      .eq('user_id', userId)
      .eq('church_id', churchId)
      .maybeSingle();
    return data as IGroupRequest | null;
  }

  async requestGroup(userId: string, churchId: string, groupId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('group_requests')
      .insert({ user_id: userId, church_id: churchId, requested_group_id: groupId });
    if (error) throw error;
  }

  async cancelGroupRequest(requestId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('group_requests')
      .delete()
      .eq('id', requestId);
    if (error) throw error;
  }

  async getPendingGroupRequests(churchId: string): Promise<IGroupRequest[]> {
    const { data, error } = await this.supabase.client
      .from('group_requests')
      .select('*, groups(name)')
      .eq('church_id', churchId)
      .order('created_at');
    if (error) throw error;
    if (!data?.length) return [];

    const userIds = data.map((r: any) => r.user_id);
    const { data: profiles } = await this.supabase.client
      .from('profiles')
      .select('id, name, email, avatar_url')
      .in('id', userIds);
    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    return data.map((r: any) => ({
      ...r,
      profiles: profileMap.get(r.user_id) ?? null,
    })) as IGroupRequest[];
  }

  async approveGroupRequest(request: IGroupRequest, memberId: string): Promise<void> {
    await this.assignGroup(memberId, request.requested_group_id, request.user_id);
    const { error } = await this.supabase.client
      .from('group_requests')
      .delete()
      .eq('id', request.id);
    if (error) throw error;
  }

  // Requiere bucket 'church-photos' público en Supabase Storage
  async uploadChurchPhoto(churchId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop();
    const path = `churches/${churchId}.${ext}`;
    const { error } = await this.supabase.client.storage
      .from('church-photos')
      .upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = this.supabase.client.storage
      .from('church-photos')
      .getPublicUrl(path);
    const { error: updateError } = await this.supabase.client
      .from('churches')
      .update({ photo_url: data.publicUrl })
      .eq('id', churchId);
    if (updateError) throw updateError;
    return data.publicUrl;
  }

  async createAdminInvite(churchId: string, createdBy: string): Promise<string> {
    const { data, error } = await this.supabase.client
      .from('admin_invites')
      .insert({ church_id: churchId, created_by: createdBy })
      .select('token')
      .single();
    if (error) throw error;
    return `https://www.intercede.pe/invite/${data.token}`;
  }

  async getAdminInvite(token: string): Promise<{ church_id: string; church_name: string } | null> {
    const { data, error } = await this.supabase.client
      .from('admin_invites')
      .select('church_id, used_at, expires_at, churches(name)')
      .eq('token', token)
      .single();
    if (error) return null;
    if (data.used_at) return null;
    if (new Date(data.expires_at) < new Date()) return null;
    return { church_id: data.church_id, church_name: (data as any).churches.name };
  }

  async acceptAdminInvite(token: string, userId: string, churchId: string): Promise<void> {
    await this.supabase.client
      .from('admin_invites')
      .update({ used_by: userId, used_at: new Date().toISOString() })
      .eq('token', token);

    await this.supabase.client
      .from('profiles')
      .update({ role: 'church_admin', church_id: churchId })
      .eq('id', userId);

    const { data: existing } = await this.supabase.client
      .from('church_members')
      .select('id')
      .eq('user_id', userId)
      .eq('church_id', churchId)
      .single();

    if (!existing) {
      await this.supabase.client
        .from('church_members')
        .insert({ user_id: userId, church_id: churchId, status: 'approved' });
    }
  }

  async rejectGroupRequest(requestId: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('group_requests')
      .delete()
      .eq('id', requestId);
    if (error) throw error;
  }

  async getChurchStats(churchId: string): Promise<{
    totalMembers: number;
    prayersThisWeek: number;
    totalPrayers: number;
    answeredPrayers: number;
  }> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const [members, prayersWeek, prayersTotal, answered] = await Promise.all([
      this.supabase.client
        .from('church_members')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('status', 'approved'),
      this.supabase.client
        .from('prayers')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .gte('created_at', weekAgo),
      this.supabase.client
        .from('prayers')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId),
      this.supabase.client
        .from('prayers')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', churchId)
        .eq('status', 'answered'),
    ]);
    return {
      totalMembers:    members.count      ?? 0,
      prayersThisWeek: prayersWeek.count  ?? 0,
      totalPrayers:    prayersTotal.count ?? 0,
      answeredPrayers: answered.count     ?? 0,
    };
  }
}
