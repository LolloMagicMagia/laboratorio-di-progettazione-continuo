const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

async function readMessageTest() {
    const options = new chrome.Options();
    options.addArguments('--headless=new'); // Nuova modalità headless
    options.addArguments('--disable-gpu');  // Utile su Windows
    options.addArguments('--window-size=1920,1080'); // Facoltativo
    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        // 1. Vai alla home e imposta l'utente direttamente
        await driver.get('http://localhost:3000');

        // 2. Imposta l'ID utente nel localStorage prima che l'app React carichi
        await driver.executeScript(`
            localStorage.setItem("currentUserId", "fulH1l3gp1dXvz0iXH1Kh7lxOEo1");
        `);

        // 3. Ricarica la pagina per far sì che React legga l'utente dal localStorage
        await driver.navigate().refresh();

        // 4. Attendi che venga caricata la lista delle chat
        await driver.wait(until.elementLocated(By.css('.chat-list-item')), 10000);

        // 5. Verifica presenza badge "1" accanto alla chat di Marco Gherardi
        const unreadBadge = await driver.wait(
            until.elementLocated(By.xpath("//h3[contains(text(), 'Marco Rossi')]/ancestor::div[contains(@class, 'chat-list-item')]//span[contains(text(), '1')]")),
            10000
        );
        assert.ok(unreadBadge, "Badge '1' non trovato accanto alla chat");

        console.log("✅ Messaggio non letto rilevato correttamente (1)");

        // 6. Clicca sulla chat per aprirla
        const chatItem = await driver.findElement(By.xpath("//h3[contains(text(), 'Marco Rossi')]"));
        await chatItem.click();

        // 7. Aspetta che venga caricata la chat
        await driver.wait(until.elementLocated(By.css('.message-input')), 10000);

        // 8. Torna alla home
        await driver.navigate().back();
        await driver.wait(until.urlIs('http://localhost:3000/'), 5000);

        // 9. Attendi che il badge "1" scompaia
        await driver.wait(async () => {
            // Selettore più specifico per il badge di conteggio
            const badgeGone = await driver.findElements(
                By.xpath("//h3[contains(text(), 'Marco Rossi')]/ancestor::div[contains(@class, 'chat-list-item')]//span[contains(@class, 'message-unread-status') and contains(text(), '1')]")
            );

            console.log(`🔍 Badge non letti trovati: ${badgeGone.length}`);

            if (badgeGone.length > 0) {
                console.log("Contenuto del badge trovato:", {
                    text: await badgeGone[0].getText(),
                    class: await badgeGone[0].getAttribute('class'),
                    html: await badgeGone[0].getAttribute('outerHTML')
                });
            }

            return badgeGone.length === 0;
        }, 3000, "Badge non letti ancora presente dopo 3 secondi");

        // Se è passato il controllo sopra, badge scomparso
        console.log("✅ Badge scomparso dopo la lettura del messaggio");

    } catch (err) {
        console.error("❌ Errore nel test di lettura:", err);
        throw err;
    } finally {
        await driver.quit();
    }
}

module.exports = readMessageTest;
