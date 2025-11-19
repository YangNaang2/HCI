import React, { useEffect, useState } from "react"; // useState 추가
import { animalList } from "../util/animalData";

interface AnimalBlockProps {
    animalIdx: number;
    buttonName: "f1" | "f2" | "f3" | "f4";
}

export default function AnimalBlock({ animalIdx, buttonName }: AnimalBlockProps) {
    // 배속 상태 관리 (기본값 1.0)
    const [playbackRate, setPlaybackRate] = useState<number>(1.0);

    let pose = "";
    if (buttonName === "f1") {
        pose = animalList[animalIdx].pose1;
    } else if (buttonName === "f2") {
        pose = animalList[animalIdx].pose2;
    } else if (buttonName === "f3") {
        pose = animalList[animalIdx].pose3;
    }

    // --- TTS (음성 합성) 로직 시작 ---
    const handleSpeakDescription = () => {
        // 기존에 나오고 있던 음성이 있다면 취소
        window.speechSynthesis.cancel();

        const description = animalList[animalIdx].description;
        
        // 브라우저 지원 확인
        if (!window.speechSynthesis) {
            alert("이 브라우저는 음성 합성을 지원하지 않습니다.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(description);
        utterance.lang = "ko-KR"; // 한국어 설정
        utterance.rate = playbackRate; // [수정] 현재 설정된 배속 적용
        utterance.pitch = 1.0;    // 톤 설정

        window.speechSynthesis.speak(utterance);
    };

    // 동물이 바뀌거나(animalIdx 변경) 컴포넌트가 언마운트될 때 음성 중지
    useEffect(() => {
        // cleanup 함수
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [animalIdx]); 
    // --- TTS 로직 끝 ---

    return (
        <div>
            <div>
                <h2>Animal: {animalList[animalIdx].name}</h2>
                <h2>Pose: {pose}</h2>

                {/* --- 음성 설명 버튼 및 텍스트 영역 --- */}
                <div style={{ margin: "15px 0", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                    
                    {/* 음성 듣기 메인 버튼 */}
                    <button 
                        onClick={handleSpeakDescription}
                        style={{
                            padding: "10px 20px",
                            fontSize: "1rem",
                            cursor: "pointer",
                            backgroundColor: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "5px",
                            marginBottom: "10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                            margin: "0 auto 10px auto" // 아래쪽 여백 추가
                        }}
                    >
                        🔊 동물 기초 설명 (음성)
                    </button>

                    {/* [추가] 배속 조절 버튼 영역 */}
                    <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                        {[1.0, 2.0, 4.0].map((rate) => (
                            <button
                                key={rate}
                                onClick={() => setPlaybackRate(rate)}
                                style={{
                                    padding: "5px 10px",
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
                                    // 선택된 배속이면 파란색, 아니면 회색
                                    backgroundColor: playbackRate === rate ? "#0056b3" : "#e0e0e0",
                                    color: playbackRate === rate ? "white" : "#333",
                                    border: "none",
                                    borderRadius: "4px",
                                    transition: "background-color 0.2s"
                                }}
                            >
                                {rate}배속
                            </button>
                        ))}
                    </div>

                    {/* 설명 텍스트 */}
                    <p style={{ fontSize: "1rem", color: "#333", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                        {animalList[animalIdx].description}
                    </p>
                </div>
                {/* ----------------------------------------- */}

            </div>
            <h1>Dictionary</h1>
            <div className="dictionary-container">
                {animalList.map((animal, index) => {
                    const isSelected = index === animalIdx;
                    return (
                        <div
                            key={index}
                            className={`dictionary-animal-block ${isSelected ? "active" : ""}`}
                        >
                            <h3>{animal.name}</h3>
                            <span>{animal.pose1} / {animal.pose2} / {animal.pose3}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}