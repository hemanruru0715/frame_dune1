module.exports = {
    images: {
      unoptimized: true, // next/image 최적화 비활성화
    },
    async headers() {
      return [
        {
          source: '/:all*(jpg|jpeg|png|gif|webp)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=3600, must-revalidate', // 캐시 설정
            },
          ],
        },
      ];
    },
  };
  