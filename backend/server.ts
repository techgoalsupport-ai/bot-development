import { serverApp } from './app.ts';
import { autoReconnectSavedBots } from './botManager.ts';

const PORT = parseInt(process.env.PORT || process.env.BACKEND_PORT || '5000', 10);
const HOST = process.env.HOST || '127.0.0.1';

serverApp.listen(PORT, HOST, () => {
  console.log(`[Wanzt Store Backend] Berjalan di http://${HOST}:${PORT}`);
  console.log(`[Wanzt Store Backend] API Endpoints aktif di http://${HOST}:${PORT}/api/`);
  setTimeout(() => {
    void autoReconnectSavedBots().catch((err) => {
      console.error('[Wanzt Store Backend] Gagal menjalankan auto-reconnect bot:', err);
    });
  }, 1500);
});
