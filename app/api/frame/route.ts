import { getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { init, validateFramesMessage } from '@airstack/frames';
import { getFarcasterUserDetails, FarcasterUserDetailsInput, FarcasterUserDetailsOutput } from '@airstack/frames';
import { fetchQuery } from "@airstack/node";
import { NEXT_PUBLIC_URL } from '@/app/config';
import { config } from "dotenv";
import { fetchUserData, insertUserDataArray } from '@/app/utils/supabase';

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
export const dynamic = 'force-dynamic';

async function getResponse(req: NextRequest): Promise<NextResponse> {
  try {

    const body = await req.json();

    config();
    const apiKey = process.env.NEXT_PUBLIC_AIRSTACK_API_KEY ?? "default_api_key";
    init(apiKey ?? "");

    //프레임유효성검사
    const { isValid, message } = await validateFramesMessage(body);
    if (!isValid) {
      return new NextResponse('Message not valid', { status: 500 });
    }
    //let myFid = Number(message?.data?.fid) || 0;
    let myFid = 500371;
    const input: FarcasterUserDetailsInput = { fid: myFid };


    /* dune API */
    const options: RequestInit = {
      method: 'GET',
      headers: {
        'X-DUNE-API-KEY': process.env.X_DUNE_API_KEY ?? ""
      }
    };
    
    const queryParams = new URLSearchParams({
       limit: '1000', 
       offset: '0',
       filters: "user1 = '" + myFid + "' OR user2 = '" + myFid + "'",
       sort_by: "total_tip_amount desc"
      });  

    const queryId = '4196350';
    const url = `https://api.dune.com/api/v1/query/${queryId}/results?${queryParams.toString()}`;
    
    // const response = await fetch(url, options);
    // if (!response.ok) {
    //   throw new Error(`HTTP error! Status: ${response.status}`);
    // }
    // const duneData = await response.json();  // JSON 응답을 duneData 변수에 할당
    // //console.log("duneData=" + JSON.stringify(duneData));
    

    /* 디젠팁 API */
    // const degenTipsUrl = `https://api.degen.tips/airdrop2/allowances?fid=${myFid}&limit=10`;
    // const degenTipsResponse = await fetch(degenTipsUrl, options);
    // if (!degenTipsResponse.ok) {
    //   throw new Error(`HTTP error! Status: ${degenTipsResponse.status}`);
    // }
    // const degenTipsData = await degenTipsResponse.json();  // JSON 응답을 duneData 변수에 할당
    // console.log("degenTipsData=" + JSON.stringify(degenTipsData));

    // const userRank = degenTipsData[0].user_rank;
    // const tipAllowance = degenTipsData[0].tip_allowance;
    // const remainingTipAllowance = degenTipsData[0].remaining_tip_allowance;

    // console.log("userRank=" + userRank);
    // console.log("tipAllowance=" + tipAllowance);
    // console.log("remainingTipAllowance=" + remainingTipAllowance);


   const socialCapitalQuery = `
          query MyQuery {
            Socials(
              input: {filter: {dappName: {_eq: farcaster}, userId: {_eq: "` + myFid + `"}}, blockchain: ethereum}
            ) {
              Social {
                profileDisplayName
                profileName
                userId
                profileImage
                profileImageContentValue {
                  image {
                    medium
                  }
                }
              }
            }
          }
       `;

    let profileName = '';
    let profileImage = '';   
    let duneData: any = '';
    let degenTipsData: any = '';
    let userRank = 0;
    let tipAllowance = 0;
    let remainingTipAllowance = 0;

    // 데이터 처리 함수 호출 후 그 결과를 기다림
    await main(myFid, socialCapitalQuery);

    //const main = async () => {
    async function main(myFid: number, socialCapitalQuery: string) {
      const server = "https://hubs.airstack.xyz";
      try {
        // API 요청을 병렬로 실행
        const [socialCapitalQueryData, duneDataResponse, degenTipsResponse] = await Promise.all([
          fetchQuery(socialCapitalQuery),
          fetch(url, options),
          fetch(`https://api.degen.tips/airdrop2/allowances?fid=${myFid}&limit=10`, options)
        ]);

        //socialCapitalQueryData
        const data = socialCapitalQueryData.data;

        // duneData 결과 처리
        if (!duneDataResponse.ok) throw new Error(`Dune API error! Status: ${duneDataResponse.status}`);
        duneData = await duneDataResponse.json();
        
        // degenTips 결과 처리
        if (!degenTipsResponse.ok) throw new Error(`Degen Tips API error! Status: ${degenTipsResponse.status}`);
        degenTipsData = await degenTipsResponse.json();

        //console.log("degenTipsData=" + JSON.stringify(degenTipsData));

        // 필요한 데이터 추출
        userRank = degenTipsData[0].user_rank;
        tipAllowance = degenTipsData[0].tip_allowance;
        remainingTipAllowance = degenTipsData[0].remaining_tip_allowance;

        //console.warn("data=" + JSON.stringify(data));
        profileName = data.Socials.Social[0].profileName;
        profileImage = data.Socials.Social[0].profileImage;

      } catch (e) {
        console.error(e);
      }
    };


    //이미지URL 인코딩처리
    const encodedProfileImage = encodeURIComponent(profileImage);

    //duneData og/route.tsx로 넘기기위한 직렬화
    const encodedDuneDataString = encodeURIComponent(JSON.stringify(duneData.result.rows));
    //console.warn("encodedDuneDataString=" + JSON.stringify(encodedDuneDataString));
    console.log("duneData.result.rows=" + JSON.stringify(duneData.result.rows));

    /**************** DB 작업 ****************/
    // DB에 fid에 해당하는 데이터 삭제 후 삽입
    const duneDataArray = duneData.result.rows; // 예시로 13개의 객체를 담고 있는 배열
    await insertUserDataArray(myFid, userRank, tipAllowance, remainingTipAllowance, profileName, profileImage, duneDataArray);
    /**************** DB 작업 끝 ****************/

  
    const frameUrl = `${NEXT_PUBLIC_URL}/api/frame?fid=${myFid}&cache_burst=${Math.floor(Date.now() / 1000)}`;

    return new NextResponse(
      getFrameHtmlResponse({
        buttons: [
          { 
            label: 'MyStats/🔎' 
          },
          { 
            action: 'link', 
            label: '🔄Share', 
            target: `https://warpcast.com/~/compose?text=Check your degen's real-time price and allowance, and how many times it's been sent and received. Frame created by @hemanruru&embeds%5B%5D=${encodeURIComponent(frameUrl)}`
          },
          {
            action: 'link', 
            label: '@sinbiro', 
            target: 'https://warpcast.com/hemanruru' 
          },
        ],
        image: { 
          src: `${NEXT_PUBLIC_URL}/api/og?profileName=${profileName}&fid=${myFid}&profileImage=${encodedProfileImage}
                                         &duneDataString=${encodedDuneDataString}
                                         &userRank=${userRank}&tipAllowance=${tipAllowance}&remainingTipAllowance=${remainingTipAllowance}
                                         &cache_burst=${Math.floor(Date.now() / 1000)}`,
          aspectRatio: '1:1',
        },
        postUrl: `${NEXT_PUBLIC_URL}/api/frame?cache_burst=${Math.floor(Date.now() / 1000)}`,
        //state: { time: new Date().toISOString() },
      })
    );
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}


export async function POST(req: NextRequest): Promise<Response> {
  return getResponse(req);
}


export async function GET(req: NextRequest) {
  // Next.js의 NextRequest 객체에서 URL과 쿼리 매개변수를 직접 가져옵니다.
  const url = req.nextUrl; // NextRequest의 nextUrl 속성 사용
  const fid = Number(url.searchParams.get('fid')); // 'fid' 매개변수 추출

  console.log("Extracted FID:", fid);

  interface duneDataItem {
    fid: number;
    seq_no: number;
    user1: string;
    user2: string;
    username1: string;
    username2: string;
    tips_from_user1_to_user2: number;
    tips_from_user2_to_user1: number;
    total_tip_amount: number;
    user_rank: number;
    tip_allowance: number;
    remaining_tip_allowance: number;
    profile_name: string;
    profile_image: string;
  }

  /**************** DB 작업 ****************/
  const data = await fetchUserData(fid);
  if (!data || data.length === 0) {
    return new NextResponse('No data found', { status: 404 });
  }
  const duneDataString: duneDataItem[] = data;
  //console.log("api/frame/route.ts_data=" + JSON.stringify(data));
  /**************** DB 작업 끝 ****************/

  // frameData 배열을 JSON 문자열로 변환하고 URL 인코딩
  const encodedDuneDataString = encodeURIComponent(JSON.stringify(duneDataString));
  const profileImage = encodeURIComponent(duneDataString[0].profile_image);
  const frameUrl = `${NEXT_PUBLIC_URL}/api/frame?fid=${duneDataString[0].fid}&cache_burst=${Math.floor(Date.now() / 1000)}`;
  //console.log("encodedDuneDataString_GET=" + JSON.stringify(duneDataString));

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        { 
          label: 'MyStats/🔎' 
        },
        { 
          action: 'link', 
          label: '🔄Share', 
          target: `https://warpcast.com/~/compose?text=Check your degen's real-time price and allowance, and how many times it's been sent and received. Frame created by @hemanruru&embeds%5B%5D=${encodeURIComponent(frameUrl)}`
        },
        {
          action: 'link', 
          label: '@sinbiro', 
          target: 'https://warpcast.com/hemanruru' 
        },
      ],
      image: { 
        src: `${NEXT_PUBLIC_URL}/api/og?profileName=${duneDataString[0].profile_name}&fid=${duneDataString[0].fid}&profileImage=${profileImage}
                                       &duneDataString=${encodedDuneDataString}
                                       &userRank=${duneDataString[0].user_rank}&tipAllowance=${duneDataString[0].tip_allowance}&remainingTipAllowance=${duneDataString[0].remaining_tip_allowance}
                                       &cache_burst=${Math.floor(Date.now() / 1000)}`,
        aspectRatio: '1:1',
      },
      postUrl: `${NEXT_PUBLIC_URL}/api/frame?cache_burst=${Math.floor(Date.now() / 1000)}`,
      //state: { time: new Date().toISOString() },
    })
  );
}
