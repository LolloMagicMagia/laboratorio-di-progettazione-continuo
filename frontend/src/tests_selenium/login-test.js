// login-test.js
const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

async function loginTest() {
    const options = new chrome.Options();
    options.addArguments('--headless=new'); // Nuova modalità headless
    options.addArguments('--disable-gpu');  // Utile su Windows
    options.addArguments('--window-size=1920,1080'); // Facoltativo

    const driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .build();

    try {
        await driver.get('http://localhost:3000/login');
        await driver.wait(until.urlContains('/login'), 5000);
        console.log('✅ Aperta pagina di login');

        await driver.findElement(By.id('email')).sendKeys('gherardi200011@gmail.com');
        await driver.findElement(By.id('password')).sendKeys('123456');
        console.log('✍️  Dati di accesso inseriti');

        await driver.findElement(By.css('.login-button')).click();
        console.log('🔐 Login avviato');

        await driver.wait(until.urlIs('http://localhost:3000/'), 10000);
        console.log('✅ Login completato e reindirizzamento eseguito');

        const currentUserId = await driver.executeScript('return localStorage.getItem("currentUserId");');
        const currentUserEmail = await driver.executeScript('return localStorage.getItem("currentUserEmail");');

        assert(currentUserId, '❌ currentUserId non trovato nel localStorage');
        assert.strictEqual(currentUserEmail, 'gherardi200011@gmail.com');
        console.log('✅ localStorage verificato');
        console.log('🎉 Test Login completato con successo');

    } catch (error) {
        console.error('❌ Errore durante il test di login:', error);
        await driver.takeScreenshot().then((img) => {
            require('fs').writeFileSync('login-error.png', img, 'base64');
            console.log('📸 Screenshot salvato: login-error.png');
        });
        throw error;
    } finally {
        await driver.quit();
    }
}

// ✅ CHIAMATA DIRETTA ALLA FUNZIONE
module.exports = loginTest;
