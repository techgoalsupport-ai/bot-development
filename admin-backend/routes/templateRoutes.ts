import { Router, Request, Response } from 'express';
import {
  TemplateService,
  TemplateCategory,
  ALL_TEMPLATE_CATEGORIES,
} from '../services/templateService.ts';

export const templateRouter = Router();

// GET /templates - Mengambil daftar seluruh template pesan
templateRouter.get('/templates', (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const templates = TemplateService.getAllTemplates(category);
    return res.json({
      success: true,
      templates,
    });
  } catch (error: any) {
    console.error('[Admin Templates] Gagal mengambil template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal memuat template pesan.',
    });
  }
});

// GET /templates/export-json - Mengekspor template dalam format JSON terpisah Enter per kategori
templateRouter.get('/templates/export-json', (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const exported = TemplateService.formatTemplatesAsGroupedJson(category);
    return res.json({
      success: true,
      count: exported.count,
      jsonText: exported.jsonText,
    });
  } catch (error: any) {
    console.error('[Admin Templates] Gagal mengekspor JSON template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal mengekspor JSON template.',
    });
  }
});

// POST /templates/import-json - Mengimpor paket template JSON multi-kategori sekaligus
templateRouter.post('/templates/import-json', (req: Request, res: Response) => {
  try {
    const { data, jsonText, mode, defaultActive } = req.body || {};
    let parsedPayload: unknown = data;

    if (parsedPayload === undefined && typeof jsonText === 'string') {
      try {
        parsedPayload = JSON.parse(jsonText);
      } catch (parseErr: any) {
        return res.status(400).json({
          success: false,
          error: `Format JSON tidak valid: ${parseErr?.message || 'Syntax error'}`,
        });
      }
    }

    if (parsedPayload === undefined && req.body && typeof req.body === 'object' && !('data' in req.body) && !('jsonText' in req.body)) {
      parsedPayload = req.body;
    }

    const importMode = mode === 'replace_category' ? 'replace_category' : 'append';
    const result = TemplateService.importTemplatesFromJson(parsedPayload, {
      mode: importMode,
      defaultActive: defaultActive !== false,
    });

    return res.status(201).json({
      success: true,
      message: `Berhasil mengimpor ${result.importedCount} paket template.`,
      importedCount: result.importedCount,
      templates: result.templates,
      warnings: result.warnings,
    });
  } catch (error: any) {
    console.error('[Admin Templates] Gagal mengimpor JSON template:', error);
    return res.status(400).json({
      success: false,
      error: error.message || 'Gagal mengimpor paket template JSON.',
    });
  }
});

// POST /templates - Menambahkan template baru (paket: pesan + footer + tombol)
templateRouter.post('/templates', (req: Request, res: Response) => {
  try {
    const { name, category, content, footer_text, buttons, is_active } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Nama template wajib diisi.',
      });
    }

    if (!category || !ALL_TEMPLATE_CATEGORIES.includes(category as TemplateCategory)) {
      return res.status(400).json({
        success: false,
        error: 'Kategori template tidak valid.',
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Isi pesan template tidak boleh kosong.',
      });
    }

    const newTemplate = TemplateService.createTemplate({
      name: String(name),
      category: category as TemplateCategory,
      content: String(content),
      footer_text: typeof footer_text === 'string' ? footer_text : '',
      buttons: Array.isArray(buttons) ? buttons : undefined,
      is_active: is_active !== undefined ? is_active : 1,
    });

    return res.status(201).json({
      success: true,
      message: 'Template berhasil ditambahkan.',
      template: newTemplate,
    });
  } catch (error: any) {
    console.error('[Admin Templates] Gagal menambahkan template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal menyimpan template baru.',
    });
  }
});

// PUT /templates/:id - Mengedit template
templateRouter.put('/templates/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID template tidak valid.' });
    }

    const { name, category, content, footer_text, buttons, is_active } = req.body;
    if (category !== undefined && !ALL_TEMPLATE_CATEGORIES.includes(category as TemplateCategory)) {
      return res.status(400).json({
        success: false,
        error: 'Kategori template tidak valid.',
      });
    }

    const updated = TemplateService.updateTemplate(id, {
      name,
      category,
      content,
      footer_text: typeof footer_text === 'string' ? footer_text : undefined,
      buttons: Array.isArray(buttons) ? buttons : undefined,
      is_active,
    });

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Template tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: 'Template berhasil diperbarui.',
      template: updated,
    });
  } catch (error: any) {
    console.error('[Admin Templates] Gagal mengedit template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal memperbarui template.',
    });
  }
});

// PATCH /templates/:id/status - Toggle aktif/nonaktifkan template
templateRouter.patch('/templates/:id/status', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID template tidak valid.' });
    }

    const { is_active } = req.body;
    const updated = TemplateService.toggleTemplateStatus(id, is_active);

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Template tidak ditemukan.' });
    }

    return res.json({
      success: true,
      message: `Template berhasil ${updated.is_active === 1 ? 'diaktifkan' : 'dinonaktifkan'}.`,
      template: updated,
    });
  } catch (error: any) {
    console.error('[Admin Templates] Gagal toggle status template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal mengubah status template.',
    });
  }
});

// DELETE /templates/:id - Menghapus template
templateRouter.delete('/templates/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, error: 'ID template tidak valid.' });
    }

    const success = TemplateService.deleteTemplate(id);
    if (!success) {
      return res.status(404).json({ success: false, error: 'Template tidak ditemukan atau sudah dihapus.' });
    }

    return res.json({
      success: true,
      message: 'Template berhasil dihapus secara permanen.',
    });
  } catch (error: any) {
    console.error('[Admin Templates] Gagal menghapus template:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Gagal menghapus template.',
    });
  }
});
