const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

async function sendMessageTest() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const testMessage = `Messaggio test inviato alle ${timestamp}`;
    const options = new chrome.Options();
    options.addArguments('--headless=new'); // Nuova modalità headless
    options.addArguments('--disable-gpu');  // Utile su Windows
    options.addArguments('--window-size=1920,1080'); // Facoltativo
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // 1. Login come Marco Gherardi
        await driver.get('http://localhost:3000/login');
        await driver.findElement(By.id('email')).sendKeys('gherardi200011@gmail.com');
        await driver.findElement(By.id('password')).sendKeys('123456');
        await driver.findElement(By.css('.login-button')).click();

        // 2. Attendi home e apri chat con Luigi Bianchi
        await driver.wait(until.urlIs('http://localhost:3000/'), 10000);
        const chatWithLuigi = await driver.findElement(By.xpath("//h3[contains(text(), 'Luigi Bianchi')]"));
        await chatWithLuigi.click();

        // 3. Attendi che venga caricata la chat
        await driver.wait(until.elementLocated(By.css('.message-input')), 10000);

        // 4. Invia un messaggio
        const input = await driver.findElement(By.css('.message-input'));
        await input.sendKeys(testMessage);
        const sendButton = await driver.findElement(By.css('.message-send-button'));
        await sendButton.click();

        // 5. Attendi che appaia nella lista messaggi
        const messageSelector = By.xpath(`//p[contains(text(), "${testMessage}")]`);
        await driver.wait(until.elementLocated(messageSelector), 10000);

        // 6. Verifica che in chat il messaggio abbia solo ✓
        const messageElement = await driver.findElement(messageSelector);
        const statusSpan = await messageElement.findElement(
            By.xpath(`following-sibling::p[contains(@class, "message-time")]/span[contains(text(), "✓")]`)
        );
        const statusText = await statusSpan.getText();
        assert.strictEqual(statusText, "✓", "In chat, il messaggio dovrebbe avere solo ✓");

        console.log("✅ Messaggio inviato e ✓ visualizzato correttamente in chat");

        // 7. Clic sul pulsante indietro (router.back)
        const backButton = await driver.findElement(By.id('back-button'));
        await backButton.click();

        // 8. Attendi ritorno alla pagina principale
        await driver.wait(until.urlIs('http://localhost:3000/'), 5000);

        // 9. Verifica che la chat di Luigi Bianchi abbia:
        // - il testo del messaggio
        // - ✓ accanto (spunta singola)
        // - badge "1"
    // Trova l'elemento della chat specifica
        const chatItem = await driver.findElement(
            By.xpath(`//h3[contains(text(), 'Luigi Bianchi')]/ancestor::div[contains(@class, 'chat-list-item')]`)
        );

        // Verifica la spunta di lettura
        const readStatus = await chatItem.findElement(By.css('.message-read-status'));
        const statusText2 = await readStatus.getText();

        // Verifica che sia presente solo ✓ (messaggio non ancora letto dall'altro utente)
        assert.strictEqual(statusText2, "✓", "Dovrebbe mostrare solo ✓ per messaggio non letto");

        console.log("✅ Chat con Luigi mostra ✓");

    } catch (err) {
        console.error("❌ Errore nel test di invio e verifica spunta/badge:", err);
        throw err;
    } finally {
        await driver.quit();
    }
}

module.exports = sendMessageTest;
