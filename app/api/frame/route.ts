import { getFrameHtmlResponse } from '@coinbase/onchainkit/frame';
import { NextRequest, NextResponse } from 'next/server';
import { init, validateFramesMessage } from '@airstack/frames';
import { getFarcasterUserDetails, FarcasterUserDetailsInput, FarcasterUserDetailsOutput } from '@airstack/frames';
import { fetchQuery } from "@airstack/node";
import { NEXT_PUBLIC_URL } from '@/app/config';
import { config } from "dotenv";
import { fetchUserData, updateInsertUserData } from '@/app/utils/supabase';

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
    
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const duneData = await response.json();  // JSON 응답을 duneData 변수에 할당
    console.log("duneData=" + JSON.stringify(duneData));
    

    /* 디젠팁 API */
    const degenTipsUrl = `https://api.degen.tips/airdrop2/allowances?fid=${myFid}&limit=10`;
    const degenTipsResponse = await fetch(degenTipsUrl, options);
    if (!degenTipsResponse.ok) {
      throw new Error(`HTTP error! Status: ${degenTipsResponse.status}`);
    }
    const degenTipsData = await degenTipsResponse.json();  // JSON 응답을 duneData 변수에 할당
    console.log("degenTipsData=" + JSON.stringify(degenTipsData));

    const userRank = degenTipsData[0].user_rank;
    const tipAllowance = degenTipsData[0].tip_allowance;
    const remainingTipAllowance = degenTipsData[0].remaining_tip_allowance;

    console.log("userRank=" + userRank);
    console.log("tipAllowance=" + tipAllowance);
    console.log("remainingTipAllowance=" + remainingTipAllowance);


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

     // 데이터 처리 함수 호출 후 그 결과를 기다림
    await main(myFid, socialCapitalQuery);

    //const main = async () => {
    async function main(myFid: number, socialCapitalQuery: string) {
      const server = "https://hubs.airstack.xyz";
      try {
        // API 요청을 병렬로 실행
        const [socialCapitalQueryData] = await Promise.all([
          fetchQuery(socialCapitalQuery)
         
        ]);

        //socialCapitalQueryData
        const data = socialCapitalQueryData.data;

        //console.warn("data=" + JSON.stringify(data));
        profileName = data.Socials.Social[0].profileName;
        profileImage = data.Socials.Social[0].profileImage;
      } catch (e) {
        console.error(e);
      }
    };


    //이미지URL 인코딩처리
    const encodedProfileImage = encodeURIComponent(profileImage);

    /**************** DB 작업 ****************/
    // DB에 업데이트 또는 삽입
    await updateInsertUserData({
      fid: myFid,
      profile_name: profileName,
      profile_image: profileImage,
     
    });
    /**************** DB 작업 끝 ****************/


    //duneData og/route.tsx로 넘기기위한 직렬화
    const duneDataString = encodeURIComponent(JSON.stringify(duneData.result.rows));
    console.warn("###duneDataString=" + JSON.stringify(duneDataString));

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
            target: `https://warpcast.com/~/compose?text=Check your Moxie Stats. Frame created by @hemanruru&embeds%5B%5D=${encodeURIComponent(frameUrl)}`
          },
          {
            action: 'link', 
            label: '@sinbiro', 
            target: 'https://warpcast.com/hemanruru' 
          },
        ],
        image: { 
          src: `${NEXT_PUBLIC_URL}/api/og?profileName=${profileName}&fid=${myFid}&profileImage=${encodedProfileImage}
                                         &duneDataString=${duneDataString}
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

  // frameData의 타입 정의
  interface FrameData {
    fid: number;
    profile_name: string;
    profile_image: string;
  }

  /**************** DB 작업 ****************/
  const data = await fetchUserData(fid);
  if (!data) {
    return new NextResponse('No data found', { status: 404 });
  }
  console.log("api/frame/route.ts_data=" + JSON.stringify(data));
  /**************** DB 작업 끝 ****************/

  const frameData: FrameData = {
    fid: data.fid,
    profile_name: data.profile_name,
    profile_image: data.profile_image,
  };

  const profileImage = encodeURIComponent(frameData.profile_image);
  const frameUrl = `${NEXT_PUBLIC_URL}/api/frame?fid=${frameData.fid}&cache_burst=${Math.floor(Date.now() / 1000)}`;

  console.log("api/frame/route.frameData=" + JSON.stringify(frameData));

  return new NextResponse(
    getFrameHtmlResponse({
      buttons: [
        { 
          label: 'MyStats/🔎' 
        },
        { 
          action: 'link', 
          label: '🔄Share', 
          target: `https://warpcast.com/~/compose?text=Check your Moxie Stats. Frame created by @hemanruru&embeds%5B%5D=${encodeURIComponent(frameUrl)}`
        },
        {
          action: 'link', 
          label: '@sinbiro', 
          target: 'https://warpcast.com/hemanruru' 
        },
      ],
      image: { 
        src: `${NEXT_PUBLIC_URL}/api/og?profileName=${frameData.profile_name}&fid=${frameData.fid}&profileImage=${profileImage}
                                       &cache_burst=${Math.floor(Date.now() / 1000)}`,
        aspectRatio: '1:1',
      },
      postUrl: `${NEXT_PUBLIC_URL}/api/frame?cache_burst=${Math.floor(Date.now() / 1000)}`,
      //state: { time: new Date().toISOString() },
    })
  );
}
