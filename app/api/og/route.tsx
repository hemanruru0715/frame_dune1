import { ImageResponse } from "@vercel/og";
import { NEXT_PUBLIC_URL } from '@/app/config';
import fs from 'fs';
import path from 'path';
import { fetchCoinData } from '@/app/utils/fetchCoinData'; // utils 폴더에서 함수 가져오기
import { generateChart } from '@/app/utils/generateChart';

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

  const farScore = searchParams.get('farScore') ?? "";
  //const farBoost = searchParams.get('farBoost') ?? "";
  const farRank = searchParams.get('farRank') ?? "";
  const finalFarScore = parseFloat(farScore).toFixed(2).toLocaleString();
  //const finalFarBoost = parseFloat(farBoost).toLocaleString();
  const finalFarRank = parseFloat(farRank).toLocaleString();

  const tvl = searchParams.get('tvl') ?? "";
  const availableClaimAmount = searchParams.get('availableClaimAmount') ?? "";

  const stakedTvl = searchParams.get('stakedTvl') ?? "";
  const unStakedTvl = searchParams.get('unStakedTvl') ?? "";

  const todayAmount = searchParams.get('todayAmount') ?? "";
  const finalTodayAmount = parseFloat(todayAmount).toLocaleString();

  const replyCount = searchParams.get('replyCount') ?? "";
  const likeCount = searchParams.get('likeCount') ?? "";
  const recastCount = searchParams.get('recastCount') ?? "";
  const quoteCount = searchParams.get('quoteCount') ?? "";

  // console.warn("profileName=" + profileName);
  // console.warn("fid=" + fid);


  let like  = 0;
  let reply = 0;
  let rcQt  = 0;
  let finalLike = 'N/A';
  let finalReply = 'N/A';
  let finalRcQt = 'N/A';

  let likeUsd  = 0;
  let replyUsd = 0;
  let rcQtUsd  = 0;

  let replykee  = 0;
  let finalReplykee  = 'N/A';

  let likeKrw  = 0;
  let replyKrw = 0;
  let rcQtKrw  = 0;

  let tvlUsd = 0;
  let availableClaimAmountUsd = 0;
  
  let tvlKrw = 0;
  let availableClaimAmountKrw = 0;
  
  let finalStakedTvl = 'N/A'
  let finalUnStakedTvl = 'N/A'

  let stakedTvlUsd = 0;
  let unStakedTvlUsd = 0;

  let stakedTvlKrw = 0;
  let unStakedTvlKrw = 0;


  let todayAmountUsd    = 0;

  let todayAmountKrw    = 0;

  let finalReplyCount = 0;
  let finalLikeCount = 0;
  let finalRcQtCount = 0;

  let moxieUsdPrice = 'N/A';
  let moxieKrwPrice = 'N/A';

  try {
    const { moxieUsdPrice: usdPrice, moxieKrwPrice: krwPrice } = await fetchCoinData();
    moxieUsdPrice = parseFloat(usdPrice).toLocaleString('en-US', { minimumFractionDigits: 5 });
    moxieKrwPrice = parseFloat(krwPrice).toLocaleString('ko-KR');

    console.warn("moxieUsdPrice=" + moxieUsdPrice);
    console.warn("moxieKrwPrice=" + moxieKrwPrice);

    //화면 구성값 계산
    like  = parseFloat((parseFloat(farScore) * 0.5).toFixed(2));
    reply = parseFloat((parseFloat(farScore) * 1).toFixed(2));
    rcQt  = parseFloat((parseFloat(farScore) * 2).toFixed(2));
    finalLike  = like.toLocaleString();
    finalReply = reply.toLocaleString();
    finalRcQt  = rcQt.toLocaleString();

     replykee = like + reply + rcQt;
     finalReplykee = replykee.toLocaleString();

     console.warn("finalLike=" + finalLike);
     console.warn("finalReply=" + finalReply);
     console.warn("finalRcQt=" + finalRcQt);

    /* like,reply,rcqt 관련 USD */
    likeUsd  = parseFloat((like * parseFloat(moxieUsdPrice)).toFixed(4)); //finalLikeUsd 시 0이 나와서 임시 likeUsd로 화면에 보여줌
    replyUsd = parseFloat((reply * parseFloat(moxieUsdPrice)).toFixed(4));
    rcQtUsd  = parseFloat((rcQt * parseFloat(moxieUsdPrice)).toFixed(4));

    /* like,reply,rcqt 관련 KRW */
    likeKrw  = parseFloat((like * parseFloat(moxieKrwPrice)).toFixed(0));
    replyKrw = parseFloat((reply * parseFloat(moxieKrwPrice)).toFixed(0));
    rcQtKrw  = parseFloat((rcQt * parseFloat(moxieKrwPrice)).toFixed(0));

    /* tvl 관련 USD */
    tvlUsd    = parseFloat((parseFloat(tvl) * parseFloat(moxieUsdPrice)).toFixed(2));
    availableClaimAmountUsd    = parseFloat((parseFloat(availableClaimAmount) * parseFloat(moxieUsdPrice)).toFixed(2));

    /* tvl 관련 KRW */
    tvlKrw    = parseFloat((parseFloat(tvl) * parseFloat(moxieKrwPrice)).toFixed(0));
    availableClaimAmountKrw    = parseFloat((parseFloat(availableClaimAmount) * parseFloat(moxieKrwPrice)).toFixed(0));


    /* stakedTvl, unStakedTvl 관련 USD */
    stakedTvlUsd    = parseFloat((parseFloat(stakedTvl) * parseFloat(moxieUsdPrice)).toFixed(2));
    unStakedTvlUsd    = parseFloat((parseFloat(unStakedTvl) * parseFloat(moxieUsdPrice)).toFixed(2));

    /* stakedTvl, unStakedTvl 관련 KRW */
    stakedTvlKrw    = parseFloat((parseFloat(stakedTvl) * parseFloat(moxieKrwPrice)).toFixed(0));
    unStakedTvlKrw    = parseFloat((parseFloat(unStakedTvl) * parseFloat(moxieKrwPrice)).toFixed(0));
    
    finalStakedTvl = Number((Number(stakedTvl) / 1e3).toFixed(1)).toLocaleString();
    finalUnStakedTvl = Number((Number(unStakedTvl) / 1e3).toFixed(1)).toLocaleString();

    /* today,weekly,lifeTime 관련 USD */
    todayAmountUsd    = parseFloat((parseFloat(todayAmount) * parseFloat(moxieUsdPrice)).toFixed(2).toLocaleString());
    
    /* today,weekly,lifeTime 관련 KRW */
    todayAmountKrw    = parseFloat((parseFloat(todayAmount) * parseFloat(moxieKrwPrice)).toFixed(0).toLocaleString());

    /* 댓글, 좋아요, 리캐 및 인용 개수 */
    finalReplyCount = parseFloat(replyCount);
    finalLikeCount = parseFloat(likeCount);
    finalRcQtCount = parseFloat(recastCount) + parseFloat(quoteCount);

  } catch (error) {
    console.error('Error fetching MOXIE price:', error);
  }


   // 차트 이미지 생성
   const chartImageBuffer = await generateChart(fid);

   // Buffer를 Base64 문자열로 변환
   const base64Image = chartImageBuffer.toString('base64');
   const imageSrc = `data:image/png;base64,${base64Image}`;

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
          color: '#DC143C',
          padding: '40px',
          boxSizing: 'border-box',
          //backgroundImage: 'linear-gradient(145deg, #6d5dfc 10%, #b2a3f6 90%)',
          backgroundImage: `url(${NEXT_PUBLIC_URL}/autumn_color2.png)`,
        }}
      >


        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '80px', marginBottom: '35px' }}>
          <div style={{ display: 'flex', textAlign: 'left' }}>
            <img
              src={profileImage}
              height="150"
              width="150"
              style={{
                borderRadius: '35%',
                objectFit: 'cover',
                marginRight: '20px',
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontSize: '30px', marginTop: '20px' }}>
              <div style={{ display: 'flex', marginRight: '20px' }}>@{profileName}</div>
              <div style={{ display: 'flex', marginRight: '40px' }}>FID:{fid}</div>
            </div>
          </div>

          <div style={{ position: 'absolute', top: '0px', right: '470px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={`${NEXT_PUBLIC_URL}/Moxie_Maxi_Scared.png`}
              height="200"
              width="200"  // 크기 조정
              style={{
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ position: 'absolute', top: '0px', right: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img
              src={`${NEXT_PUBLIC_URL}/Moxie_Maxi_HandsUp.png`}
              height="230"
              width="220"  // 크기 조정
              style={{
                objectFit: 'contain',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong></strong>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems:'flex-end', fontSize: '30px' }}>
              <strong style={{ marginLeft: '150px', fontSize: '25px' }}>Moxie Price</strong>
              <strong style={{ marginLeft: '150px' }}>{moxieUsdPrice} USD</strong>
              <strong style={{ marginLeft: '150px' }}>{moxieKrwPrice} KRW</strong>
            </div>
          </div>

        </div>


        {/* 행 단위로 구성된 섹션들 */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '25px' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>FarRank</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>FarScore</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Locked</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Today</strong>
          </div>
       </div>

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '40px' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalFarRank}</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalFarScore}</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalStakedTvl}K</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalTodayAmount}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '25px' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Like</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Reply</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Recast/Quote</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>Replyke</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '40px' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalLike}</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalReply}</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalRcQt}</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>{finalReplykee}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '30px', color: '#DC143C' }}>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>({finalLikeCount}/500)</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>({finalReplyCount}/200)</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong>({finalRcQtCount}/100)</strong>
          </div>
          <div style={{ display: 'flex', flex: 1, justifyContent: 'center' }}>
            <strong></strong>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%', fontSize: '50px', marginBottom: '10px' }}>
          <div style={{ display: 'flex', textAlign: 'left' }}>
            <strong></strong>
          </div>
          <div style={{ display: 'flex', textAlign: 'right' }}>
            <strong></strong>
          </div>
        </div>


      {/* img 태그로 Base64 인코딩된 차트 이미지 렌더링 */}
      <img src={imageSrc} alt="Chart" style={{ width: '100%', height: '100%' }} />

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
