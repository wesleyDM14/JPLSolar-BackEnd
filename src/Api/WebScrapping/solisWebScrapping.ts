import puppeteer, { ElementHandle, HTTPResponse, Page } from 'puppeteer';

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
const applyDropdown = async (
  page: Page,
  placeholderText: string,
  optionText: string,
  dropdownIndex = 0
) => {
  console.log(`\n--- [DEBUG] Iniciando applyDropdown para placeholder: "${placeholderText}" ---`);

  // 1. Encontra todos os inputs que correspondem ao placeholder
  const matchingInputs: ElementHandle[] = [];
  const allInputs = await page.$$('input.el-input__inner');
  console.log(`[DEBUG] Encontrados ${allInputs.length} inputs na página.`);

  for (const [index, input] of allInputs.entries()) {
    const attr = await input.evaluate(el => el.getAttribute('placeholder'));
    console.log(`[DEBUG] Input #${index} tem o placeholder: "${attr}"`);
    if (attr && attr.includes(placeholderText)) {
      matchingInputs.push(input);
    }
  }

  console.log(`[DEBUG] Encontrados ${matchingInputs.length} dropdowns com placeholder "${placeholderText}".`);

  // 2. Verifica se existe um dropdown no índice que queremos
  if (matchingInputs.length <= dropdownIndex) {
    throw new Error(`❌ Dropdown com placeholder "${placeholderText}" (ocorrência ${dropdownIndex + 1}) não encontrado.`);
  }

  // 3. Clica no dropdown correto
  const targetInput = matchingInputs[dropdownIndex];
  console.log(`[DEBUG] Clicando no dropdown de índice ${dropdownIndex}...`);
  await targetInput.click();

  // 4. Espera as opções aparecerem
  console.log('[DEBUG] Aguardando o painel do dropdown ficar visível...');
  await page.waitForSelector('.el-select-dropdown:not([style*="display: none"]) .el-select-dropdown__item', { timeout: 10000 });
  console.log('[DEBUG] Painel do dropdown está visível.');
  await new Promise(r => setTimeout(r, 1000)); // Pausa para garantir que as opções renderizem

  // 5. Loga todas as opções visíveis para depuração
  const availableOptions = await page.evaluate(() => {
    const options = Array.from(document.querySelectorAll('.el-select-dropdown:not([style*="display: none"]) .el-select-dropdown__item span'));
    return options.map(opt => opt.textContent?.trim());
  });
  console.log(`[DEBUG] Opções encontradas no dropdown: [${availableOptions.join(', ')}]`);

  // 6. Tenta encontrar e clicar na opção desejada
  const clicked = await page.evaluate((text) => {
    const options = Array.from(document.querySelectorAll('.el-select-dropdown__item'));
    const targetOption = options.find(i => i.textContent?.trim() === text);
    if (targetOption) {
      (targetOption as HTMLElement).click();
      return true;
    }
    return false;
  }, optionText);

  if (!clicked) {
    throw new Error(`❌ Opção de texto "${optionText}" não foi encontrada entre as opções visíveis.`);
  }
  console.log(`[DEBUG] Clicou com sucesso na opção "${optionText}".`);
  console.log(`--- [DEBUG] Finalizado applyDropdown para: "${placeholderText}" ---\n`);
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

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'pt-BR,pt;q=0.9'
  });
  await page.emulateTimezone('America/Sao_Paulo');

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
    const USERNAME_SELECTOR = 'input[placeholder="Input email or username"]';
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

    await applyDropdown(page, 'Select', 'Inverter', 0);
    await applyDropdown(page, 'Select Status', 'All');
    await applyDropdown(page, 'Select', '100/page', 1);

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
    const USERNAME_SELECTOR = 'input[placeholder="Input email or username"]';
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

    await applyDropdown(page, 'Select', 'Inverter', 0);
    await applyDropdown(page, 'Select Status', 'All');
    await applyDropdown(page, 'Select', '100/page', 1);
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
    const USERNAME_SELECTOR = 'input[placeholder="Input email or username"]';
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