import { ImageResponse } from '@vercel/og';
import { NEXT_PUBLIC_URL } from '@/app/config';
import fs from 'fs';
import path from 'path';

// font 파일 경로
const fontPath = path.join(process.cwd(), 'public/fonts/Recipekorea.ttf');
const fontData = fs.readFileSync(fontPath);

//export const runtime = 'edge';
export const dynamic = "force-dynamic";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontFamily: '"Recipekorea"', // 폰트 이름
          backgroundColor: 'white',
          //backgroundImage: 'linear-gradient(to bottom, #dbf4ff, #fff1f1)',
          backgroundImage: `url(${NEXT_PUBLIC_URL}/bg_moxie.png)`,
          color: 'black',
          padding: '40px',
        }}
      >
        {/* 상단 바 */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid ',
            paddingBottom: '0px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 25 }}>
              FARCASTER MOXIE
            </div>
            <img
              src={`${NEXT_PUBLIC_URL}/moxieImage.png`} // 이미지 경로
              height="90"  // 크기 조정
              width="150"   // 크기 조정
              style={{
                marginLeft: '700px', // 텍스트와 이미지 사이에 여백 추가
                objectFit: 'contain',
              }}
            />
          </div>
        </div>

        {/* 메인 내용 */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            padding: '20px 50px',
            margin: '0 42px',
            fontSize: 60,
            width: 'auto',
            maxWidth: 550,
            textAlign: 'center',
            backgroundColor: '#B455A2',
            color: 'white',
            opacity: 0.8,
            lineHeight: 2,
          }}
        >
          Check your Moxie Stats now!
        </div>

        {/* 하단 바 */}
        <div
          style={{
            display: 'flex',
            width: '100%',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid black',
            paddingTop: '10px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 25 }}>$MOXIE STATS</div>
          <div style={{ display: 'flex', fontSize: 25 }}>by @hemanruru</div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 1200,
      fonts: [
        {
          name: 'Recipekorea',
          data: fontData,
          weight: 400,
          style: 'normal',
        },
      ],
    }
  );
}
