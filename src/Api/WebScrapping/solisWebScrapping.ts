import puppeteer, { ElementHandle, HTTPResponse } from 'puppeteer';

const STATION_LIST_API = 'https://www.soliscloud.com/api/station/list';
const DETAIL_API_URLS = [
  'https://www.soliscloud.com/api/station/detailMix',
  'https://www.soliscloud.com/api/chart/station/day/v2',
  'https://www.soliscloud.com/api/station/stationAllEnergy'
];
const ALARM_API_URL = 'https://www.soliscloud.com/api/alarm/list';
const COLLECTOR_LIST_API = 'https://www.soliscloud.com/api/collector/listV2';
const INVERTER_LIST_API = 'https://www.soliscloud.com/api/inverter/listV2';

export const scrappingSolisData = async (username: string, password: string): Promise<any[]> => {
  if (!username || !password) throw new Error('Nome de usuário e senha são obrigatórios.');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });

  const page = await browser.newPage();
  const collectedData: { url: string; data: any }[] = [];

  const interceptAPI = (url: string) =>
    new Promise<void>((resolve) => {
      const handler = async (response: HTTPResponse) => {
        if (response.url().includes(url) && response.ok()) {
          try {
            const data = await response.json();
            collectedData.push({ url, data });
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

    await page.type('input[placeholder="Preencha o e-mail ou nome de utilizador"]', username);
    await page.type('input[type="password"]', password);
    await page.click('label.el-checkbox');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('div.login-btn button'),
    ]);

    await interceptAPI(STATION_LIST_API);
    const stationList = collectedData.find(d => d.url.includes(STATION_LIST_API));
    const stationId = stationList?.data?.data?.page?.records?.[0]?.id;

    if (!stationId) throw new Error('Nenhuma estação encontrada.');

    const detailPage = `https://www.soliscloud.com/#/station/stationDetails/generalSituation/${stationId}`;
    await page.goto(detailPage, { waitUntil: 'networkidle2' });
    await Promise.allSettled(DETAIL_API_URLS.map(interceptAPI));

    const alarmPage = `https://www.soliscloud.com/#/station/stationdetail_5?id=${stationId}`;
    await page.goto(alarmPage, { waitUntil: 'networkidle2' });

    const applyDropdown = async (
      placeholderText: string,
      optionText: string,
      occurrenceIndex = 0
    ) => {
      const inputs = await page.$$('input.el-input__inner');
      for (const input of inputs) {
        const attr = await input.evaluate(el => el.getAttribute('placeholder'));
        if (attr && attr.includes(placeholderText)) {
          await input.click();
          break;
        }
      }

      await page.waitForSelector('.el-select-dropdown__item');

      const clicked = await page.$$eval(
        '.el-select-dropdown__item',
        (items, { text, index }) => {
          const matches = items.filter(i => i.textContent?.trim() === text);
          if (matches.length > index) {
            (matches[index] as HTMLElement).click();
            return true;
          }
          return false;
        },
        { text: optionText, index: occurrenceIndex }
      );

      if (!clicked) throw new Error(`❌ Opção "${optionText}" ocorrência #${occurrenceIndex + 1} não encontrada para "${placeholderText}"`);

      await new Promise(r => setTimeout(r, 500));

      await page.waitForFunction(
        (placeholder, value) => {
          const el = Array.from(document.querySelectorAll('input.el-input__inner'))
            .find(i => i.getAttribute('placeholder')?.includes(placeholder)) as HTMLInputElement;
          return el?.value?.trim().includes(value);
        },
        {},
        placeholderText,
        optionText
      );

    };

    await applyDropdown('Selecionar', 'Inversor');
    await applyDropdown('Select Status', 'Tudo', 1);
    await applyDropdown('Selecione', '100/pagina');

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

export const scrappingSolisErroData = async (username: string, password: string, plantId: string): Promise<any[]> => {
  if (!username || !password) throw new Error('Nome de usuário e senha são obrigatórios.');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });

  const page = await browser.newPage();
  const collectedData: { url: string; data: any }[] = [];

  const interceptAPI = (url: string) =>
    new Promise<void>((resolve) => {
      const handler = async (response: HTTPResponse) => {
        if (response.url().includes(url) && response.ok()) {
          try {
            const data = await response.json();
            collectedData.push({ url, data });
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

    await page.type('input[placeholder="Preencha o e-mail ou nome de utilizador"]', username);
    await page.type('input[type="password"]', password);
    await page.click('label.el-checkbox');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('div.login-btn button'),
    ]);

    const alarmPage = `https://www.soliscloud.com/#/station/stationdetail_5?id=${plantId}`;
    await page.goto(alarmPage, { waitUntil: 'networkidle2' });

    const applyDropdown = async (
      placeholderText: string,
      optionText: string,
      occurrenceIndex = 0
    ) => {
      const inputs = await page.$$('input.el-input__inner');
      for (const input of inputs) {
        const attr = await input.evaluate(el => el.getAttribute('placeholder'));
        if (attr && attr.includes(placeholderText)) {
          await input.click();
          break;
        }
      }

      await page.waitForSelector('.el-select-dropdown__item');

      const clicked = await page.$$eval(
        '.el-select-dropdown__item',
        (items, { text, index }) => {
          const matches = items.filter(i => i.textContent?.trim() === text);
          if (matches.length > index) {
            (matches[index] as HTMLElement).click();
            return true;
          }
          return false;
        },
        { text: optionText, index: occurrenceIndex }
      );

      if (!clicked) throw new Error(`❌ Opção "${optionText}" ocorrência #${occurrenceIndex + 1} não encontrada para "${placeholderText}"`);

      await new Promise(r => setTimeout(r, 500));

      await page.waitForFunction(
        (placeholder, value) => {
          const el = Array.from(document.querySelectorAll('input.el-input__inner'))
            .find(i => i.getAttribute('placeholder')?.includes(placeholder)) as HTMLInputElement;
          return el?.value?.trim().includes(value);
        },
        {},
        placeholderText,
        optionText
      );

    };

    await applyDropdown('Selecionar', 'Inversor');
    await applyDropdown('Select Status', 'Tudo', 1);
    await applyDropdown('Selecione', '100/pagina');

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

export const scrappingDashboard = async (username: string, password: string): Promise<any[]> => {
  if (!username || !password) throw new Error('Nome de usuário e senha são obrigatórios.');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });

  const page = await browser.newPage();
  const collectedData: { url: string; data: any }[] = [];

  const interceptAPI = (url: string) =>
    new Promise<void>((resolve) => {
      const handler = async (response: HTTPResponse) => {
        if (response.url().includes(url) && response.ok()) {
          try {
            const data = await response.json();
            collectedData.push({ url, data });
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

    await page.type('input[placeholder="Preencha o e-mail ou nome de utilizador"]', username);
    await page.type('input[type="password"]', password);
    await page.click('label.el-checkbox');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('div.login-btn button'),
    ]);

    await interceptAPI(STATION_LIST_API);
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