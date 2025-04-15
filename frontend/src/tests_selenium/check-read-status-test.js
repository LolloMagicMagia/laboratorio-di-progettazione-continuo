const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");

async function checkReadStatusTest() {
    const options = new chrome.Options();
    options.addArguments("--headless=new"); // Nuova modalità headless
    options.addArguments("--disable-gpu");  // Utile su Windows
    options.addArguments("--window-size=1920,1080"); // Facoltativo
    const driver = await new Builder()
        .forBrowser("chrome")
        .setChromeOptions(options)
        .build();

    try {
        // 1. Login con Marco Gherardi
        await driver.get("http://localhost:3000/login");
        await driver.findElement(By.id("email")).sendKeys("gherardi200011@gmail.com");
        await driver.findElement(By.id("password")).sendKeys("123456");
        await driver.findElement(By.css(".login-button")).click();

        await driver.wait(until.urlIs("http://localhost:3000/"), 10000);

        // 2. Verifica la presenza della doppia spunta nella homepage
        const chatItemHome = await driver.wait(
            until.elementLocated(By.xpath("//h3[contains(text(), 'Luigi Bianchi')]/ancestor::div[contains(@class, 'chat-list-item')]")),
            10000
        );

        // Verifica la presenza della spunta doppia (✓✓) accanto al messaggio sulla homepage
        const doubleCheckHome = await chatItemHome.findElement(
            By.xpath(".//span[contains(text(), '✓✓')]")
        );

        assert.ok(doubleCheckHome, "Non trovato ✓✓ accanto al messaggio nella homepage");

        console.log("✅ Spunta ✓✓ visibile sulla homepage");

        // 3. Clicca sulla chat con Luigi Bianchi
        await chatItemHome.click();
        await driver.wait(until.elementLocated(By.css(".message-input")), 10000);

        // 4. Verifica che il messaggio abbia la spunta doppia (✓✓) nella chat
        // Cerchiamo il messaggio all'interno della chat
        const messageTimeElement = await driver.wait(
            until.elementLocated(By.xpath("//p[contains(@class, 'message-time')]/span[contains(text(), '✓✓')]")),
            10000
        );

        // Verifica che la spunta doppia (✓✓) sia presente accanto al timestamp
        assert.ok(messageTimeElement, "Non trovato ✓✓ accanto al messaggio nella chat");

        console.log("✅ Spunta ✓✓ visibile nella chat: il messaggio è stato letto");

    } catch (err) {
        console.error("❌ Errore nel test di doppia spunta:", err);
        throw err;
    } finally {
        await driver.quit();
    }
}

module.exports = checkReadStatusTest;
