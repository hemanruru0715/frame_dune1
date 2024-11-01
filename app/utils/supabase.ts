import { createClient } from '@supabase/supabase-js';

// Supabase 클라이언트 초기화
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

//개발db, 운영db 분리하기
const supabaseDb = process.env.NODE_ENV == 'development' ? 'user_stats_3_dev' : 'user_stats_3';
const supabase = createClient(supabaseUrl, supabaseKey);


// fid에 해당하는 데이터 가져오기 함수
export const fetchUserData = async (fid: number) => {
    const { data, error } = await supabase
      .from(supabaseDb)
      .select('*')
      .eq('fid', fid)
      .single();
  
    if (error) {
      if (error.code !== 'PGRST116') { // row가 없는 경우 에러를 제외
        console.error("Supabase 데이터 검색 오류:", error);
        throw new Error('Error fetching data from Supabase');
      }
      return null;
    }
  
    return data;
};

// 데이터를 업데이트 또는 삽입하는 함수
export const updateInsertUserData = async (userData: any) => {
    const { fid } = userData;

    console.warn("updateInsertUserData=" + JSON.stringify(userData));
  
    // 기존 데이터가 있는지 확인
    const existingEntry = await fetchUserData(fid);
  
    if (existingEntry) {
      // 업데이트
      const { error: updateError } = await supabase
        .from(supabaseDb)
        .update({
          ...userData,
          mod_dtm: getKoreanISOString()
        })
        .eq('fid', fid);
  
      if (updateError) {
        console.error("Supabase 데이터 업데이트 오류:", updateError);
        throw new Error('Error updating data in Supabase');
      }
    } else {
      // 삽입
      const { error: insertError } = await supabase
        .from(supabaseDb)
        .insert([{
          ...userData,
          reg_dtm: getKoreanISOString()
        }]);
  
      if (insertError) {
        console.error("Supabase 데이터 삽입 오류:", insertError);
        throw new Error('Error inserting data into Supabase');
      }
    }
};



function getKoreanISOString() {
    const now = new Date();
    const koreanTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC+9 시간대 반영
    return koreanTime.toISOString().slice(0, 19).replace('T', ' ');
}

const getUTCYYYYMMDD = (date: Date): string => {

  // 현재 환경이 Vercel 서버(UTC)인지 로컬(KST)인지 확인
  const isServerUTC = date.getTimezoneOffset() === 0;
  console.log("isServerUTC=" + isServerUTC);

  // 로컬(KST) 환경에서는 9시간을 빼고, 서버(UTC) 환경에서는 그대로 둠
  const UTCTime = isServerUTC ? date : new Date(date.getTime() - 9 * 60 * 60 * 1000);
  console.log("UTCTime=" + UTCTime);

  // const UTCTime = new Date(date.getTime() - 9 * 60 * 60 * 1000); // 9시간(밀리초 단위) 빼기
  // console.log("UTCTime=" + UTCTime);

  const year = UTCTime.getFullYear();
  const month = String(UTCTime.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 1을 더함
  const day = String(UTCTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};