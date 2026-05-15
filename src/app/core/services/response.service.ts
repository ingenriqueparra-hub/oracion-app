import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { IResponse, IResponseWithProfile } from '../../models/response.model';

@Injectable({ providedIn: 'root' })
export class ResponseService {
  constructor(private supabase: SupabaseService) {}

  async getByPrayer(prayerId: string): Promise<IResponseWithProfile[]> {
    const { data: responses, error } = await this.supabase.client
      .from('responses')
      .select('*')
      .eq('prayer_id', prayerId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    if (!responses?.length) return [];

    const userIds = [...new Set(responses.map((r: any) => r.user_id))];
    const { data: profiles } = await this.supabase.client
      .from('profiles')
      .select('id, name, avatar_url, level')
      .in('id', userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    return responses.map((r: any) => ({
      ...r,
      profiles: profileMap.get(r.user_id) ?? { name: 'Usuario', avatar_url: null },
    })) as IResponseWithProfile[];
  }

  async createText(prayerId: string, userId: string, text: string): Promise<IResponse> {
    const { data, error } = await this.supabase.client
      .from('responses')
      .insert({ prayer_id: prayerId, user_id: userId, text })
      .select()
      .single();
    if (error) throw error;
    return data as IResponse;
  }

  async createAudio(prayerId: string, userId: string, audioBlob: Blob): Promise<IResponse> {
    const ext = audioBlob.type.includes('ogg') ? 'ogg' : 'webm';
    const fileName = `${prayerId}/${userId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await this.supabase.client.storage
      .from('audio-responses')
      .upload(fileName, audioBlob, { contentType: audioBlob.type });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = this.supabase.client.storage
      .from('audio-responses')
      .getPublicUrl(fileName);

    const { data, error } = await this.supabase.client
      .from('responses')
      .insert({ prayer_id: prayerId, user_id: userId, audio_url: publicUrl })
      .select()
      .single();
    if (error) throw error;
    return data as IResponse;
  }
}
