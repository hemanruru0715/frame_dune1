import { ImageResponse } from "@vercel/og";
import { NEXT_PUBLIC_URL } from '@/app/config';
import fs from 'fs';
import path from 'path';
import { fetchCoinData } from '@/app/utils/fetchCoinData'; // utils 폴더에서 함수 가져오기

//export const runtime = "edge";
export const dynamic = "force-dynamic";

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// font 파일 경로
const fontPath = path.join(process.cwd(), 'public/fonts/Recipekorea.ttf');
const fontData = fs.readFileSync(fontPath);


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const profileName = searchParams.get('profileName');
  const fid = searchParams.get('fid');
  const profileImage = searchParams.get('profileImage') || `${NEXT_PUBLIC_URL}/default-image.png`;

  // duneData 파라미터 파싱
  const duneDataString = searchParams.get('duneDataString');
  const duneData = duneDataString ? JSON.parse(decodeURIComponent(duneDataString)) : [];
  //console.warn("duneData=" + JSON.stringify(duneData));

  // degenData 파라미터 파싱
  const userRank = searchParams.get('userRank');
  const tipAllowance = parseFloat(searchParams.get('tipAllowance') ?? "").toLocaleString();
  const remainingTipAllowance = parseFloat(searchParams.get('remainingTipAllowance') ?? "").toLocaleString();

  //Degen 가격 실시간 데이터 가져오기
  let degenUsdPrice = 'N/A';
  let degenKrwPrice = 'N/A';
  try {
    const { degenUsdPrice: usdPrice, degenKrwPrice: krwPrice } = await fetchCoinData();
    degenUsdPrice = parseFloat(usdPrice).toLocaleString('en-US', { minimumFractionDigits: 5 });
    degenKrwPrice = parseFloat(krwPrice).toLocaleString('ko-KR');

    console.warn("degenUsdPrice=" + degenUsdPrice);
    console.warn("degenKrwPrice=" + degenKrwPrice);

  } catch (error) {
    console.error('Error fetching DEGEN price:', error);
  }


   /* dune 쿼리 반복문 html 처리 */
   const rowsContent = duneData.map((row: any, index: any) => (

    <div key={index} style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '30px', color: '#000000' }}>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        <strong>{row.username1}</strong>
      </div>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        <strong>{row.username2}</strong>
      </div>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        <strong>{row.tips_from_user1_to_user2 >= 15 ? <span style={{color: 'red'}}>{row.tips_from_user1_to_user2}</span> : row.tips_from_user1_to_user2}</strong>
      </div>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        <strong>{row.tips_from_user2_to_user1 >= 15 ? <span style={{color: 'red'}}>{row.tips_from_user2_to_user1}</span> : row.tips_from_user2_to_user1}</strong>
      </div>
      <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
        <strong>{parseFloat(row.total_tip_amount).toLocaleString()}</strong>
      </div>
    </div>
  ));
   


  if (searchParams != null) {
    return new ImageResponse(
      (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          height: '100%',
          width: '100%',
          //fontFamily: '"Arial", sans-serif',
          fontFamily: '"Poppins-Regular"', // 폰트 이름
          //backgroundColor: '#7158e2',
          color: '#522d9d', //진한보라색
          padding: '40px',
          boxSizing: 'border-box',
          //backgroundImage: 'linear-gradient(145deg, #6d5dfc 10%, #b2a3f6 90%)',
          backgroundImage: `url(${NEXT_PUBLIC_URL}/degen_exchange.png)`,
        }}
      >


        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '80px', marginBottom: '35px' }}>
          <div style={{ display: 'flex', textAlign: 'left' }}>
            <img
              src={profileImage}
              height="150"
              width="150"
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                marginRight: '20px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '30px', marginTop: '20px' }}>
              <div style={{ display: 'flex', marginRight: '20px' }}>@{profileName}</div>
              <div style={{ display: 'flex', marginRight: '40px' }}>FID:{fid}</div>
            </div>
          </div>

          <div style={{ position: 'absolute', top: '16px', right: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={`${NEXT_PUBLIC_URL}/Moxie_Maxi_Point.png`}
              height="180"
              width="180"  // 크기 조정
              style={{
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ position: 'absolute', top: '-23px', right: '350px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={`${NEXT_PUBLIC_URL}/degen.png`}
              height="120"
              width="120"  // 크기 조정
              style={{
                objectFit: 'contain',
              }}
            />
          </div>

          {/* <div style={{ position: 'absolute', top: '0px', right: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={`${NEXT_PUBLIC_URL}/Moxie_Maxi_HandsUp.png`}
              height="230"
              width="220"  // 크기 조정
              style={{
                objectFit: 'contain',
              }}
            />
          </div> */}

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong></strong>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems:'flex-end', fontSize: '30px' }}>
              <strong style={{ marginLeft: '150px', fontSize: '25px' }}>Degen Price</strong>
              <strong style={{ marginLeft: '150px' }}>{degenUsdPrice} USD</strong>
              <strong style={{ marginLeft: '150px' }}>{degenKrwPrice} KRW</strong>
            </div>
          </div>

        </div>


        {/* 행 단위로 구성된 섹션들 */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '30px', color: 'blue'}}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>UserRank</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Tip Allowance</strong>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '30px', color: '#000000', marginBottom: '20px' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{userRank}</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>({remainingTipAllowance}/{tipAllowance})</strong>
          </div>
        </div>

        {/* 행 단위로 구성된 섹션들 */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '30px', color: 'blue' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Sender</strong>
          </div>                              
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Receiver</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Send</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Receive</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Amount</strong>
          </div>
       </div>

        {/* duneData Rows Content */}
        {rowsContent}

        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0 20px', // Padding for left and right alignment
            fontSize: '24px', // Adjust font size as needed
            //color: 'black',
            fontFamily: '"Poppins-Regular"', // 폰트 이름
          }}
        >
          <span>{getKoreanISOString()}</span>

          {/* 작성자 */}
          <span>by @hemanruru</span>
        </div>

        </div>
      ),
      {
        width: 1200,
        height: 1200,
        fonts: [
          {
            name: 'Poppins-Regular',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );



    
  } else {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 40,
            color: "black",
            background: "white",
            width: "100%",
            height: "100%",
            padding: "50px 200px",
            textAlign: "center",
            justifyContent: "center",
            alignItems: "center",
            display: "flex",
          }}
        >
          Error fetching data :(. Please try again later.
        </div>
      ),
      {
        width: 1200,
        height: 1200,
        fonts: [
          {
            name: 'Poppins-Regular',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ],
      }
    );
  }
}

function getKoreanISOString() {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9 시간대 반영
  return koreanTime.toISOString().slice(0, 19).replace('T', ' ');
}
