
/**
 * SmartStock Pro - Server Side Controller
 * Handles the deployment and serving of the React-based inventory system.
 */

function doGet(e) {
  const template = HtmlService.createTemplateFromFile('index');
  
  return template.evaluate()
    .setTitle('SmartStock Pro | Inventory Management')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Utility function to include other HTML files (CSS/JS)
 * Usage in HTML: <?!= include('FileName'); ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Server-side function example to be called from the client
 * google.script.run.getInventoryData()
 */
function getInventoryData() {
  // Logic to fetch data from a Google Sheet would go here
  // For now, it returns the structure expected by the app
  return {
    status: 'success',
    timestamp: new Date().toISOString()
  };
}
