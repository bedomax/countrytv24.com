import MemoryClient from 'mem0ai';

interface Song {
  title: string;
  artist: string;
}

class Mem0Service {
  private client: MemoryClient | null = null;

  private getClient(): MemoryClient {
    if (!this.client) {
      const apiKey = process.env.MEM0_API_KEY;
      if (!apiKey) throw new Error('MEM0_API_KEY not set');
      this.client = new MemoryClient({ apiKey });
    }
    return this.client;
  }

  async recordSongPlay(userId: string, song: Song) {
    await this.getClient().add(
      [{ role: 'user', content: `I listened to "${song.title}" by ${song.artist}` }],
      { user_id: userId }
    );
  }

  async recordLike(userId: string, song: Song) {
    await this.getClient().add(
      [{ role: 'user', content: `I really like "${song.title}" by ${song.artist}. This is one of my favorites!` }],
      { user_id: userId }
    );
  }

  async recordSkip(userId: string, song: Song) {
    await this.getClient().add(
      [{ role: 'user', content: `I skipped "${song.title}" by ${song.artist}` }],
      { user_id: userId }
    );
  }

  async getUserMemories(userId: string) {
    return await this.getClient().getAll({ user_id: userId });
  }

  async searchMemories(userId: string, query: string) {
    return await this.getClient().search(query, { user_id: userId });
  }
}

export const mem0Service = new Mem0Service();
