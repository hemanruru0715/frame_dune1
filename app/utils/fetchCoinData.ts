export async function fetchCoinData() {
    const { COINMARKETCAP_API_KEY } = process.env;
  
    //USD,KRW 한방에 호출
    const responseDegenUsd = await fetch(`https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?symbol=DEGEN&convert=USD,KRW`, {
      headers: {
        'X-CMC_PRO_API_KEY': COINMARKETCAP_API_KEY || '',
      },
    });
  
    if (!responseDegenUsd.ok) {
      throw new Error('Failed to fetch coin data');
    }
  
    const dataDegenUsd = await responseDegenUsd.json();

    //console.log("dataDegenUsd=" + JSON.stringify(dataDegenUsd));
  
    const degenUsdPrice = dataDegenUsd.data.DEGEN[0].quote.USD.price.toFixed(6);  // USD 가격
    const degenKrwPrice = dataDegenUsd.data.DEGEN[0].quote.KRW.price.toFixed(2);  // KRW 가격 (소수점 제거)
  
    return { degenUsdPrice, degenKrwPrice };
  }