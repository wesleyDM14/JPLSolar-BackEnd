import puppeteer, { ElementHandle, HTTPResponse, Page } from 'puppeteer-core';

const STATION_LIST_API = 'https://www.soliscloud.com/api/station/list';
const DETAIL_API_URLS = [
  'https://www.soliscloud.com/api/station/detailMix',
  'https://www.soliscloud.com/api/chart/station/day/v2',
  'https://www.soliscloud.com/api/station/stationAllEnergy'
];
const ALARM_API_URL = 'https://www.soliscloud.com/api/alarm/list';
const COLLECTOR_LIST_API = 'https://www.soliscloud.com/api/collector/listV2';
const INVERTER_LIST_API = 'https://www.soliscloud.com/api/inverter/listV2';

// Função helper para clicar em dropdowns, corrigida e reutilizável
const applyDropdown = async (page: Page, placeholderText: string, optionText: string, occurrenceIndex = 0) => {
    const dropdownInput = await page.evaluateHandle((text) => {
        const inputs = Array.from(document.querySelectorAll('input.el-input__inner'));
        return inputs.find(i => i.getAttribute('placeholder')?.includes(text));
    }, placeholderText);

    if (!dropdownInput || !dropdownInput.asElement()) throw new Error(`❌ Dropdown com placeholder "${placeholderText}" não encontrado.`);
    await (dropdownInput.asElement() as ElementHandle).click();

    await page.waitForSelector('.el-select-dropdown:not([style*="display: none"]) .el-select-dropdown__item');

    const clicked = await page.evaluate((text, index) => {
        const options = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
        const matches = options.filter(i => i.textContent?.trim() === text);
        if (matches.length > index) {
            (matches[index] as HTMLElement).click();
            return true;
        }
        return false;
    }, optionText, occurrenceIndex);

    if (!clicked) throw new Error(`❌ Opção "${optionText}" ocorrência #${occurrenceIndex + 1} não encontrada.`);
    
    await page.waitForFunction(
        (placeholder: string, value: string) => {
            const el = Array.from(document.querySelectorAll('input.el-input__inner')).find(i => i.getAttribute('placeholder')?.includes(placeholder)) as HTMLInputElement;
            return el?.value?.trim().includes(value);
        }, 
        { timeout: 5000 },
        placeholderText, optionText
    );
};


// Função 1
export const scrappingSolisData = async (username: string, password: string): Promise<any[]> => {
  if (!username || !password) throw new Error('Nome de usuário e senha são obrigatórios.');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.GOOGLE_CHROME_BIN || undefined,
  });

  const page = await browser.newPage();
  const collectedData: { url: string; data: any }[] = [];

  const interceptAPI = (url: string) =>
    new Promise<void>((resolve) => {
      const handler = async (response: HTTPResponse) => {
        if (response.url().includes(url) && response.ok()) {
          try {
            const data = await response.json();
            collectedData.push({ url: response.url(), data });
          } catch {
            console.warn(`⚠️ Erro ao parsear JSON da resposta da API [${url}]`);
          } finally {
            page.off('response', handler);
            resolve();
          }
        }
      };
      page.on('response', handler);
    });

  try {
    await page.goto('https://www.soliscloud.com/#/homepage', { waitUntil: 'networkidle2' });

    // ✅ CORREÇÃO APLICADA AQUI ✅
    const USERNAME_SELECTOR = 'input[placeholder="Preencha o e-mail ou nome de utilizador"]';
    await page.waitForSelector(USERNAME_SELECTOR, { timeout: 30000 });
    
    await page.type(USERNAME_SELECTOR, username);
    await page.type('input[type="password"]', password);
    await page.click('label.el-checkbox');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('div.login-btn button'),
    ]);
    
    const stationListPromise = interceptAPI(STATION_LIST_API);
    await page.waitForResponse(res => res.url().includes(STATION_LIST_API));
    await stationListPromise;
    const stationList = collectedData.find(d => d.url.includes(STATION_LIST_API));
    const stationId = stationList?.data?.data?.page?.records?.[0]?.id;
    if (!stationId) throw new Error('Nenhuma estação encontrada.');

    const detailPage = `https://www.soliscloud.com/#/station/stationDetails/generalSituation/${stationId}`;
    await page.goto(detailPage, { waitUntil: 'networkidle2' });
    await Promise.allSettled(DETAIL_API_URLS.map(interceptAPI));

    const alarmPage = `https://www.soliscloud.com/#/station/stationdetail_5?id=${stationId}`;
    await page.goto(alarmPage, { waitUntil: 'networkidle2' });
    
    await applyDropdown(page, 'Selecionar', 'Inversor');
    await applyDropdown(page, 'Select Status', 'Tudo', 1);
    await applyDropdown(page, 'Selecione', '100/pagina');

    const alarmPromise = interceptAPI(ALARM_API_URL);
    await page.waitForSelector('.el-table__body-wrapper');
    await Promise.race([
      alarmPromise,
      new Promise(res => setTimeout(res, 15000))
    ]);

    const devicePageUrl = `https://www.soliscloud.com/#/station/devicedetail?id=${stationId}`;
    const inverterListPromise = interceptAPI(INVERTER_LIST_API);
    await page.goto(devicePageUrl, { waitUntil: 'networkidle2' });
    await inverterListPromise;

    await page.waitForSelector('.gl-private-tabs');
    await new Promise(r => setTimeout(r, 2000));
    const tabHandle = await page.evaluateHandle(() => {
      const spans = Array.from(document.querySelectorAll('.gl-private-tabs .f__14'));
      const targetSpan = spans.find(span => span.textContent?.trim().includes('Registrador'));
      return targetSpan ? targetSpan.parentElement : null;
    });
    if (tabHandle && tabHandle.asElement()) {
      const collectorPromise = interceptAPI(COLLECTOR_LIST_API);
      await (tabHandle.asElement() as ElementHandle).click();
      await collectorPromise;
    } else {
      console.warn('⚠️ Aba "Registrador de dados" não encontrada.');
    }
  } catch (error) {
    console.error(`❌ Erro: ${(error as Error).message}`);
    throw error;
  } finally {
    await browser.close();
  }
  return collectedData;
};


// Função 2
export const scrappingSolisErroData = async (username: string, password: string, plantId: string): Promise<any[]> => {
  if (!username || !password) throw new Error('Nome de usuário e senha são obrigatórios.');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.GOOGLE_CHROME_BIN || undefined,
  });

  const page = await browser.newPage();
  const collectedData: { url: string; data: any }[] = [];

  const interceptAPI = (url: string) =>
    new Promise<void>((resolve) => {
      const handler = async (response: HTTPResponse) => {
        if (response.url().includes(url) && response.ok()) {
          try {
            const data = await response.json();
            collectedData.push({ url: response.url(), data });
          } catch {
            console.warn(`⚠️ Erro ao parsear JSON da resposta da API [${url}]`);
          } finally {
            page.off('response', handler);
            resolve();
          }
        }
      };
      page.on('response', handler);
    });

  try {
    await page.goto('https://www.soliscloud.com/#/homepage', { waitUntil: 'networkidle2' });

    // ✅ CORREÇÃO APLICADA AQUI ✅
    const USERNAME_SELECTOR = 'input[placeholder="Preencha o e-mail ou nome de utilizador"]';
    await page.waitForSelector(USERNAME_SELECTOR, { timeout: 30000 });
    
    await page.type(USERNAME_SELECTOR, username);
    await page.type('input[type="password"]', password);
    await page.click('label.el-checkbox');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('div.login-btn button'),
    ]);

    const alarmPage = `https://www.soliscloud.com/#/station/stationdetail_5?id=${plantId}`;
    await page.goto(alarmPage, { waitUntil: 'networkidle2' });
    
    await applyDropdown(page, 'Selecionar', 'Inversor');
    await applyDropdown(page, 'Select Status', 'Tudo', 1);
    await applyDropdown(page, 'Selecione', '100/pagina');

    const alarmPromise = interceptAPI(ALARM_API_URL);
    await page.waitForSelector('.el-table__body-wrapper');
    await Promise.race([
      alarmPromise,
      new Promise(res => setTimeout(res, 15000))
    ]);

  } catch (error) {
    console.error(`❌ Erro: ${(error as Error).message}`);
    throw error;
  } finally {
    await browser.close();
  }
  return collectedData;
}


// Função 3
export const scrappingDashboard = async (username: string, password: string): Promise<any[]> => {
  if (!username || !password) throw new Error('Nome de usuário e senha são obrigatórios.');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.GOOGLE_CHROME_BIN || undefined,
  });

  const page = await browser.newPage();
  const collectedData: { url: string; data: any }[] = [];

  const interceptAPI = (url: string) =>
    new Promise<void>((resolve) => {
      const handler = async (response: HTTPResponse) => {
        if (response.url().includes(url) && response.ok()) {
          try {
            const data = await response.json();
            collectedData.push({ url: response.url(), data });
          } catch {
            console.warn(`⚠️ Erro ao parsear JSON da resposta da API [${url}]`);
          } finally {
            page.off('response', handler);
            resolve();
          }
        }
      };
      page.on('response', handler);
    });

  try {
    await page.goto('https://www.soliscloud.com/#/homepage', { waitUntil: 'networkidle2' });

    // ✅ CORREÇÃO APLICADA AQUI ✅
    const USERNAME_SELECTOR = 'input[placeholder="Preencha o e-mail ou nome de utilizador"]';
    await page.waitForSelector(USERNAME_SELECTOR, { timeout: 30000 });
    
    await page.type(USERNAME_SELECTOR, username);
    await page.type('input[type="password"]', password);
    await page.click('label.el-checkbox');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('div.login-btn button'),
    ]);

    const stationListPromise = interceptAPI(STATION_LIST_API);
    await page.waitForResponse(res => res.url().includes(STATION_LIST_API));
    await stationListPromise;
    const stationList = collectedData.find(d => d.url.includes(STATION_LIST_API));
    const stationId = stationList?.data?.data?.page?.records?.[0]?.id;
    if (!stationId) throw new Error('Nenhuma estação encontrada.');

    const detailPage = `https://www.soliscloud.com/#/station/stationDetails/generalSituation/${stationId}`;
    await page.goto(detailPage, { waitUntil: 'networkidle2' });
    await Promise.allSettled(DETAIL_API_URLS.map(interceptAPI));

  } catch (error) {
    console.error(`❌ Erro: ${(error as Error).message}`);
    throw error;
  } finally {
    await browser.close();
  }
  return collectedData;
}