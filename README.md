# 🦁 DOTIONARY (Doctionary)
> **시각장애인을 위한 촉각 기반 인터랙티브 동물 백과사전** > *Tactile-based Interactive Animal Encyclopedia for the Visually Impaired*

![Project Status](https://img.shields.io/badge/Project-Active-brightgreen)
![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)
![Hardware](https://img.shields.io/badge/Hardware-Dot_Pad-black)

<br/>

## 📖 프로젝트 소개 (About)
**DOTIONARY**는 동물에 대한 시각적 정보 습득에 어려움을 겪는 시각장애 아동을 위해 개발된 **촉각-청각 융합 교육 플랫폼**입니다. 

기존의 점자나 단순 음성 설명의 한계를 넘어, **촉각 디스플레이(Dot Pad)**를 통해 동물의 외형을 손끝으로 탐색하고, **인터랙티브 퀴즈**를 통해 학습 효과를 극대화할 수 있도록 설계되었습니다.

### 🎯 핵심 목표
* **시각의 촉각화:** 평면 이미지를 닷패드(Dot Pad)에 최적화된 점자 패턴으로 실시간 렌더링
* **멀티모달 인터랙션:** 촉각(Tactile) + 음성(TTS) + 효과음(Sound)을 동시에 제공
* **순환 학습 구조:** `탐색` → `학습` → `퀴즈` 매커니즘을 통한 자기주도 학습 유도

<br/>

## ✨ 주요 기능 (Key Features)

### 1. 🖐️ 촉각 데이터 시각화 (Tactile Visualization)
* **생물학적 분류:** 시각적 특징이 뚜렷한 25종의 동물(포유류, 조류, 어류 등) 데이터셋 구축
* **다각도 탐색:** 동물당 3가지 포즈 제공 (Pose 1: 전체 외형, Pose 2: 발자국, Pose 3: 특징 부위)
* **AI 기반 전처리:** `Nano Banana Pro`를 활용하여 촉각 식별에 최적화된 고대비/단순화 이미지 생성

### 2. 🔊 청각 피드백 & TTS (Audio Feedback)
* **동물 울음소리:** F4 버튼 클릭 시 해당 동물의 실제 울음소리 재생 (중첩 방지 로직 적용)
* **스마트 TTS:** 인지 심리학의 Chunk 이론(5~7개 정보 단위)을 적용하여, `Gemini 3 Pro`로 생성한 아동 친화적 설명 제공
* **배속 조절:** 학습 속도에 맞춰 1.0x / 2.0x / 4.0x 배속 조절 기능 지원

### 3. 🧩 인터랙티브 퀴즈 (Gamified Quiz)
* **2가지 모드:** 통합 모드(전체 랜덤) / 카테고리 모드(종별 학습)
* **단계별 학습:** * `<Q-step>`: 문제 풀이 및 3지 선다 선택
  * `<A-step>`: 정답 확인 및 포즈별 심화 탐색
* **동적 UX:** 상황에 따라 닷패드 물리 버튼(F1~F4)의 기능이 자동으로 매핑 변경

### 4. 💻 웹 시뮬레이터 (Web Simulator)
* 하드웨어(Dot Pad)가 없는 환경에서도 개발 및 테스트가 가능하도록 **웹 기반 시뮬레이터** 구현
* 실제 핀(Pin) 배열과 동일한 16진수 데이터를 웹 화면에 렌더링하여 하드웨어와 상태 동기화

<br/>

## 🛠️ 기술 스택 (Tech Stack)

| Category | Technology |
| :--- | :--- |
| **Frontend** | React, TypeScript |
| **Hardware Interface** | Dot Pad API, Serial Communication |
| **AI / Data** | Google Gemini 3 Pro (Text Gen), Nano Banana Pro (Image Gen) |
| **Audio** | Web Speech API (TTS), Howler.js (or HTML5 Audio) |
| **Collaboration** | GitHub, Notion, Discord |

<br/>

## ⚙️ 설치 및 실행 (Installation)

이 프로젝트는 **Dot Pad** 하드웨어와의 연동을 전제로 하지만, 웹 시뮬레이터를 통해 일반 브라우저에서도 실행 가능합니다.

```bash
# 1. 저장소 클론
git clone [https://github.com/your-username/DOTIONARY.git](https://github.com/your-username/DOTIONARY.git)

# 2. 프로젝트 폴더로 이동
cd DOTIONARY

# 3. 패키지 설치
npm install

# 4. 개발 서버 실행
npm start
