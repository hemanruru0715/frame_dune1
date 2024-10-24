export async function fetchCoinData() {
    const { COINMARKETCAP_API_KEY } = process.env;
  
    //USD,KRW 한방에 호출
    const responseMoxieUsd = await fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=MOXIE&convert=USD,KRW`, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY || '',
      },
    });
  
    if (!responseMoxieUsd.ok) {
      throw new Error('Failed to fetch coin data');
    }
  
    const dataMoxieUsd = await responseMoxieUsd.json();

    // const responseMoxieKrw = await fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=MOXIE&convert=KRW`, {
    //   headers: {
    //     'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY || '',
    //   },
    // });
  
    // if (!responseMoxieKrw.ok) {
    //   throw new Error('Failed to fetch coin data');
    // }
  
    // const dataMoxieKrw = await responseMoxieKrw.json();
  
    //console.warn("###dataMoxieUsd=" + JSON.stringify(dataMoxieUsd));
    // console.warn("###dataMoxieKrw=" + JSON.stringify(dataMoxieKrw));
  
    const moxieUsdPrice = dataMoxieUsd.data.MOXIE[0].quote.USD.price.toFixed(6);  // USD 가격
    const moxieKrwPrice = dataMoxieUsd.data.MOXIE[0].quote.KRW.price.toFixed(2);  // KRW 가격 (소수점 제거)
  
    return { moxieUsdPrice, moxieKrwPrice };
  }