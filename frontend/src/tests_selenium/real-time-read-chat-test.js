const { Builder, By, until } = require("selenium-webdriver");
const chrome = require("selenium-webdriver/chrome");
const assert = require("assert");

async function realTimeMessageTest() {
    const options = new chrome.Options();
    options.addArguments("--headless=new"); // Nuova modalità headless
    options.addArguments("--disable-gpu");  // Utile su Windows
    options.addArguments("--window-size=1920,1080"); // Facoltativo
    const driver1 = await new Builder().forBrowser("chrome").setChromeOptions(options).build();
    const driver2 = await new Builder().forBrowser("chrome").setChromeOptions(options).build();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const testMessage = `Messaggio in real time ✓✓ alle  ${timestamp}`;

    try {
        // 1. Login Marco Rossi nel primo browser
        await driver1.get("http://localhost:3000/login");
        await driver1.findElement(By.id("email")).sendKeys("gherardi200011@gmail.com");
        await driver1.findElement(By.id("password")).sendKeys("123456");
        await driver1.findElement(By.css(".login-button")).click();
        await driver1.wait(until.urlIs("http://localhost:3000/"), 10000);

        // 2. Ottieni currentUserId dopo login
        const userId = await driver1.executeScript("return localStorage.getItem(\"currentUserId\");");
        assert.ok(userId, "User ID non trovato nel localStorage");
        console.log("✅ ID utente di Marco Rossi:", userId);

        // 3. Secondo browser impersona Luigi Bianchi
        await driver2.get("http://localhost:3000/");
        await driver2.executeScript("localStorage.setItem(\"currentUserId\", \"fulH1l3gp1dXvz0iXH1Kh7lxOEo1\");");
        await driver2.navigate().refresh();

        // 4. Entrambe le finestre aprono la chat tra Marco Rossi e Luigi Bianchi
        await driver1.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'Luigi Bianchi')]")), 10000).click();
        await driver2.wait(until.elementLocated(By.xpath("//h3[contains(text(), 'Marco Rossi')]")), 10000).click();
        console.log("✅ Entrambi i browser hanno aperto la chat corretta");

        await driver1.sleep(1000);
        await driver2.sleep(1000);

        // 5. Invio del messaggio da parte di Marco (driver1)
        const input1 = await driver1.findElement(By.css(".message-input"));
        await input1.sendKeys(testMessage);
        await driver1.findElement(By.css(".message-send-button")).click();
        console.log("✅ Messaggio inviato:", testMessage);

        // 6. Verifica che il messaggio sia visibile in tempo reale sul driver2
        const receivedMessage = await driver2.wait(
            until.elementLocated(By.xpath(`//p[contains(text(), "${testMessage}")]`)),
            10000
        );
        assert.ok(receivedMessage, "Messaggio non ricevuto in tempo reale da Luigi");
        console.log("✅ Messaggio ricevuto in tempo reale sulla seconda finestra");

        // 7. Attendi che driver2 abbia attivato la lettura visibile
        await driver2.sleep(1500); // Tempo per triggerare il markChatAsRead nel client

        // 8. Verifica ✓✓ sul messaggio visibile nel driver1
        const messageWithDoubleCheck = await driver1.wait(
            until.elementLocated(By.xpath(`//p[contains(text(), "${testMessage}")]/following-sibling::p/span[contains(text(), "✓✓")]`)),
            10000
        );
        assert.ok(messageWithDoubleCheck, "La doppia spunta ✓✓ non è apparsa dopo la lettura");

        console.log("✅ Doppia spunta ✓✓ visualizzata correttamente su driver1");

    } catch (err) {
        console.error("❌ Errore nel test di messaggistica in tempo reale:", err);
        throw err;
    } finally {
        await driver1.quit();
        await driver2.quit();
    }
}

module.exports = realTimeMessageTest;
