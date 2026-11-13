export function buildBulkImportInstruction(entities) {
  return { type: 'bulk_import', blockName: entities.blockName || '', message: 'Upload an Excel file, generate a preview, review validation results, and confirm before records are created.', previewEndpoint: '/api/import/preview-block-residents', confirmEndpoint: '/api/import/confirm-block-residents' };
}
