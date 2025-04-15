const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");

async function sendMessageTest() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const testMessage = `Messaggio test inviato alle ${timestamp}`;

    const options = new chrome.Options();
    options.addArguments("--headless=new");
    options.addArguments("--disable-gpu");
    options.addArguments("--window-size=1920,1080");

    const driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    try {
        // 1. Login
        await driver.get("http://localhost:3000/login");
        await driver.findElement(By.id("email")).sendKeys("gherardi200011@gmail.com");
        await driver.findElement(By.id("password")).sendKeys("123456");
        await driver.findElement(By.css(".login-button")).click();

        // 2. Aspetta che la home sia caricata e clicca sulla chat con Luigi Bianchi
        const elements = await driver.wait(until.elementsLocated(By.css(".chat-name")), 10000);
        for (let el of elements) {
            const name = await el.getText();
            if (name.includes("Luigi Bianchi")) {
                await el.click();
                break;
            }
        }
        console.log("✅ Chat aperta");

        // 3. Attendi che venga caricata l'area di input del messaggio
        await driver.wait(until.elementLocated(By.css(".message-input-form")), 10000);

        // 4. Invia un nuovo messaggio
        const input = await driver.findElement(By.css(".message-input"));
        await input.sendKeys(testMessage);

        const sendButton = await driver.findElement(By.css(".message-send-button"));
        await sendButton.click();
        console.log("✅ Messaggio inviato");

        // 5. Verifica che il messaggio compaia nella lista messaggi
        const messageSelector = By.xpath(`//p[contains(text(), "${testMessage}")]`);
        await driver.wait(until.elementLocated(messageSelector), 10000);
        console.log("✅ Compare nei messaggi");

        // 6. Verifica la spunta ✓ accanto all'orario
        const messageElement = await driver.findElement(messageSelector);
        const statusSpan = await messageElement.findElement(
            By.xpath("following-sibling::p[contains(@class, \"message-time\")]/span[contains(text(), \"✓\")]")
        );
        const statusText = await statusSpan.getText();
        console.log(statusText);  // Stampa il testo trovato nella spunta
        assert.strictEqual(statusText, "✓", "Il messaggio dovrebbe avere una sola ✓ (non letto)");
        console.log("✅ Messaggio visualizzato con ✓ singola");

        // 7. Torna alla schermata home
        const backButton = await driver.findElement(By.id("back-button"));
        await backButton.click();
        await driver.wait(until.urlIs("http://localhost:3000/"), 5000);

        // 8. Verifica che la conversazione con Luigi Bianchi mostri il messaggio, la ✓, e il badge
        const chatPreview = await driver.wait(
            until.elementLocated(By.xpath("//h3[contains(text(), 'Luigi Bianchi')]")),
            10000
        );

        // Verifica ✓ nella preview
        const readStatus = await driver.wait(until.elementLocated(By.css(".message-read-status")), 3000);
        const statusText2 = await readStatus.getText();
        assert.strictEqual(statusText2, "✓", "Dovrebbe esserci una sola ✓ anche nella preview");
        console.log("✅ Preview corretta nella lista conversazioni");

        console.log("🎉 Tutti i test passati con successo!");

    } catch (err) {
        console.error("❌ Errore durante il test:", err);
        throw err;
    } finally {
        await driver.quit();
    }
}

module.exports = sendMessageTest;
