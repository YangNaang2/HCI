import React, { useEffect, useState, useRef } from "react";
import { animalList } from "../util/animalData";

interface AnimalBlockProps {
    animalIdx: number;
    buttonName: "f1" | "f2" | "f3" | "f4";
}

export default function AnimalBlock({ animalIdx, buttonName }: AnimalBlockProps) {
    // 배속 상태 관리
    const [playbackRate, setPlaybackRate] = useState<number>(1.0);
    
    // 오디오 객체 관리를 위한 ref (mp3 재생용)
    const audioRef = useRef<HTMLAudioElement | null>(null);

    let pose = "";
    if (buttonName === "f1") {
        pose = animalList[animalIdx].pose1;
    } else if (buttonName === "f2") {
        pose = animalList[animalIdx].pose2;
    } else if (buttonName === "f3") {
        pose = animalList[animalIdx].pose3;
    } else if (buttonName === "f4") {
        pose = "울음소리"; // [추가] f4일 때 화면에 표시할 텍스트
    }

    // --- 1. MP3 울음소리 재생 로직 (f4 버튼 감지) ---
    useEffect(() => {
        // 기존 재생 중인 소리가 있다면 정지 및 초기화
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        // f4 버튼이 눌렸고, 해당 동물에게 사운드 파일이 있다면 재생
        if (buttonName === "f4") {
            const soundPath = animalList[animalIdx].sound;
            
            if (soundPath) {
                // TTS가 읽고 있다면 중단 (소리 겹침 방지)
                window.speechSynthesis.cancel();

                const audio = new Audio(soundPath);
                audioRef.current = audio;
                audio.play().catch((e) => {
                    console.error("오디오 재생 실패:", e);
                    // alert("소리 파일을 찾을 수 없습니다."); // 필요 시 주석 해제
                });
            } else {
                console.log("이 동물의 울음소리 파일이 없습니다.");
            }
        }

        // Cleanup: 컴포넌트가 사라지거나 동물이 바뀌면 소리 끄기
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
        };
    }, [buttonName, animalIdx]); // 버튼이나 동물이 바뀔 때마다 실행


    // --- 2. TTS (음성 설명) 로직 ---
    const handleSpeakDescription = () => {
        // 울음소리가 나오고 있다면 정지
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        // 기존 TTS 정지
        window.speechSynthesis.cancel();

        const description = animalList[animalIdx].description;
        
        if (!window.speechSynthesis) {
            alert("이 브라우저는 음성 합성을 지원하지 않습니다.");
            return;
        }

        const utterance = new SpeechSynthesisUtterance(description);
        utterance.lang = "ko-KR";
        utterance.rate = playbackRate;
        utterance.pitch = 1.0;

        window.speechSynthesis.speak(utterance);
    };

    // 동물이 바뀌면 TTS도 정지 (안전 장치)
    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [animalIdx]);


    return (
        <div>
            <div>
                <h2>Animal: {animalList[animalIdx].name}</h2>
                <h2>Pose: {pose}</h2>

                {/* --- 음성 설명 버튼 및 텍스트 영역 --- */}
                <div style={{ margin: "15px 0", padding: "10px", border: "1px solid #ccc", borderRadius: "8px", backgroundColor: "#f9f9f9" }}>
                    
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
                            margin: "0 auto 10px auto"
                        }}
                    >
                        🔊 동물 기초 설명 (음성)
                    </button>

                    <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "10px" }}>
                        {[1.0, 1.5, 2.0].map((rate) => (
                            <button
                                key={rate}
                                onClick={() => setPlaybackRate(rate)}
                                style={{
                                    padding: "5px 10px",
                                    fontSize: "0.8rem",
                                    cursor: "pointer",
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

                    <p style={{ fontSize: "1rem", color: "#333", whiteSpace: "pre-wrap", lineHeight: "1.5" }}>
                        {animalList[animalIdx].description}
                    </p>
                </div>
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