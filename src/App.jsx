import React, { useState, Suspense, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import Experience from './Experience';
import { PageTwo } from './PageTwo';
import { TeamPage } from './TeamPage';
import { EffectComposer, Bloom } from '@react-three/postprocessing';

// Component UI được tách riêng để quản lý toàn bộ giao diện 2D
function UI({ page, activePlanet }) {
  return (
    <>
      <style>
        {`@keyframes pulse { 0% { box-shadow: 0 0 15px 0px #00aaff; } 50% { box-shadow: 0 0 25px 5px #00aaff; } 100% { box-shadow: 0 0 15px 0px #00aaff; } }`}
      </style>

      {/* Chỉ hiển thị UI dành cho Trang 2 khi đang ở trang đó */}
      {page === 2 && (
        <>
          <div style={styles.instructions}>
            <strong>Điều Khiển:</strong><br />
            W / S - Bay Tới / Lui<br />
            A / D - Bay Ngang Trái / Phải<br />
            E / Q - Bay Lên / Xuống<br />
            Chuột - Nhìn Xung Quanh<br />
            ENTER - Tương Tác
          </div>
          {/* Chỉ render thông báo khi có một hành tinh được kích hoạt */}
          {activePlanet && <div style={styles.interactionPrompt}>Nhấn ENTER để khám phá {activePlanet.name}</div>}
        </>
      )}
    </>
  );
}

function App() {
  const [page, setPage] = useState(2);
  // State của hành tinh đang ở gần được "nâng" lên đây
  const [activePlanet, setActivePlanet] = useState(null);

  // useEffect để lắng nghe phím Enter được chuyển lên đây
  // vì nó cần truy cập cả `activePlanet` và `setPage`
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Logic này chỉ chạy khi ở Page 2 và có một hành tinh đang active
      if (page === 2 && e.key.toLowerCase() === 'enter' && activePlanet) {
        alert(`Đã truy cập vào ${activePlanet.name}!`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activePlanet, page]); // Listener sẽ được cập nhật khi activePlanet hoặc page thay đổi

  return (
    <>
      {/* Lớp Canvas 3D */}
      <Canvas camera={{ position: [0, 2, 8], fov: 45 }}>
        <Suspense fallback={null}>
          {page === 1 && <Experience setPage={setPage} />}
          {page === 2 && <PageTwo setActivePlanet={setActivePlanet} setPage={setPage} />}
          {page === 3 && <TeamPage setPage={setPage} />}
        </Suspense>

        {/* Các hiệu ứng chung */}
        <EffectComposer>
          <Bloom mipmapBlur intensity={1.2} luminanceThreshold={1} />
        </EffectComposer>
      </Canvas>

      {/* Lớp UI 2D, nằm bên ngoài và render bên trên Canvas */}
      <UI page={page} activePlanet={activePlanet} />
    </>
  );
}

// Các style cho UI
const styles = {
  interactionPrompt: { position: 'absolute', bottom: '5%', left: '50%', transform: 'translateX(-50%)', padding: '15px 30px', backgroundColor: 'rgba(10, 20, 40, 0.8)', backdropFilter: 'blur(10px)', color: '#00aaff', borderRadius: '50px', border: '2px solid #00aaff', fontFamily: 'sans-serif', fontSize: '20px', fontWeight: 'bold', textAlign: 'center', zIndex: 100, pointerEvents: 'none', textTransform: 'uppercase', letterSpacing: '1px', animation: 'pulse 2s infinite', },
  instructions: { position: 'absolute', top: '20px', left: '20px', padding: '15px 20px', width: '280px', backgroundColor: 'rgba(10, 20, 40, 0.7)', backdropFilter: 'blur(10px)', color: 'white', borderRadius: '12px', border: '1px solid rgba(0, 170, 255, 0.5)', boxShadow: '0 0 15px rgba(0, 170, 255, 0.3)', fontFamily: 'sans-serif', fontSize: '15px', zIndex: 100, pointerEvents: 'none', lineHeight: '1.7', textShadow: '0 0 5px rgba(255, 255, 255, 0.5)', }
};

export default App;