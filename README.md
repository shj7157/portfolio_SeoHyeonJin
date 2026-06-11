### 🚀 서현진 | Full-Stack Developer
데이터의 흐름을 설계하고, 비즈니스의 병목 지점을 해결하는 개발자 서현진입니다.
"쿼리 최적화와 안정적인 시스템 아키텍처 설계"에 강점이 있습니다.

🛠 Tech Stack
Frontend: React, Vue.js, Styled-components, Axios, SockJS, STOMP, jQuery, CSS

Backend: Java(Spring Boot, Security), Node.js(Express)

Database: MySQL, Redis, PostgreSQL, Oracle, MS-SQL

Tools: Git, IntelliJ, Postman, VSCode

🎯 핵심 역량
Query Tuning: 인덱스 설계 및 실행 계획 분석을 통한 쿼리 응답 속도 98.4% 향상

Caching Strategy: Redis + Spring Scheduler를 이용한 데이터 조회 부하 최적화

Real-time System: WebSocket/STOMP를 활용한 대규모 실시간 알림 아키텍처 설계

API Design: RESTful 표준을 준수하는 확장 가능한 API 설계

📁 주요 프로젝트
[Sloway] :
https://github.com/bobohyeon/Sloway_Project

설명: 
직장인을 위한 워케이션 서비스 (기간: 2026.04 ~ 2026.06)

내가 맡은 직책 : 
DB설계 및 데이터베이스 최적화 담당 

내가 맡은 기능 : 
공간 CRUD - Api연동 / 공간 유형에 따른 유닛 CRUD - Api연동 / 공간, 유닛 생성,수정에 따른 공간 검수 CRUD - Api연동 / 알림(공지, 채팅, 문의) CRUD - Api연동

사용 기술 : 
Spring-boot, React, PostGres, Stomp.js, Redis, JPA/QueryDsl, KakaoMap Api

🛠 트러블슈팅 사례: 통계 조회 성능 최적화
문제 상황: 통계 데이터 실시간 조회 시 평균 28.3초 소요 (최대 32.1초), 사용자 경험 저하 문제 발생

1단계 개선 (쿼리 튜닝): 실행 계획 분석을 통해 인덱스 최적화 진행
결과: 평균 12.4초로 단축 (약 56% 향상)
한계: 여전히 사용자가 대기하기에는 긴 시간이라 판단.

2단계 개선 (캐싱 전략): Materialized View 방식의 데이터 관리 도입
해결책: Spring Scheduler를 활용하여 10분 단위로 통계 데이터를 캐시(Redis 및 별도 테이블)에 갱신
결과: 평균 0.31초로 단축 (약 98.9% 향상)



📁 주요 프로젝트
[Task-Flow] :
https://github.com/blackbean9081-svg/TaskFlow

설명: 
개발회사를 위한 프로젝트 일정 관리 서비스 (기간: 2026.02 ~ 2026.03)

내가 맡은 직책 : 
DBA

내가 맡은 기능 :
프로젝트 CRUD - Api연동 / 프로젝트 내부 마일스톤 CRUD - Api연동 / 회사, 부서, 사원, 계약 CRUD - API연동 / Interceptor를 통한 인증 유효성 검사 및 권한 검사

사용 기술: Spring-boot, Jsp, Oracle, MyBatis, JPA

🛠 트러블슈팅 사례: 권한 로직 개선을 통한 쿼리 성능 최적화
문제 상황:

마일스톤 생성 시 '담당자만 가능'하다는 초기 협의와 달리, 체크리스트는 '누구나 작성 가능'하게 구현되어 있어 기능 간의 권한 계층이 모호했습니다.
이로 인해 체크리스트 조회/생성 로직에서 불필요한 JOIN과 추가 쿼리(N+1 문제 유발 가능성)가 발생하여 시스템 효율이 저하되는 현상을 발견했습니다.

해결 과정 (협의 및 설계 변경):
기술적 이슈를 팀원들과 공유하고, 데이터 관계(프로젝트-부서-유저)를 재점검했습니다.
팀원들과 협의하여 '누구나 작성'이라는 유연성보다는 '권한에 따른 일관성'이 시스템 유지보수에 더 중요하다는 점을 설득했습니다.
그 결과, 프로젝트와 부서 관계를 기반으로 생성 가능한 유저 범위를 명확히 제한하도록 테이블 구조와 권한 로직을 수정했습니다.

결과:
복잡한 JOIN 구조를 단순화하여 쿼리 효율성을 개선했습니다.
권한 검증 로직이 간결해짐에 따라 보안성이 강화되었고, 향후 발생할 수 있는 데이터 정합성 오류를 미연에 방지했습니다.



📁 주요 프로젝트
[Trip-Tracks] : 
https://github.com/BCU-TripTracks/TripTracks

설명: 
일반인을 위한 여행관련 SNS 서비스 (기간: 2022.12 ~ 2023.10)

내가 맡은 직책 : 
2학기 팀장, DBA, 백엔드, API Developer

내가 맡은 기능 :
채팅기능을 제외한 전체 백엔드 기능 개발 및 API 설계

사용 기술: 
Node.js, Express-session, Maria-DB, Socket.io

🛠 트러블슈팅 사례: SSH 인증 및 네트워크 방화벽 설정 이슈 해결
문제 상황:
프로젝트 서버 구축 후 SSH 인증 방식을 통한 접속을 시도했으나, 팀원 전원이 인증 프로세스에 대한 이해 부족으로 서버 접속이 차단되는 상황 발생했습니다.
서버가 로컬 환경을 벗어나 실제 웹 서비스 환경으로 배포된 상태였기에 접근 권한 설정이 시급했습니다.

해결 과정 (기술 리서치 및 분석):
SSH 인증 프로토콜과 네트워크 방화벽 정책 간의 상관관계를 조사했습니다.
방화벽 설정에서 특정 포트가 닫혀있음을 확인하고, SSH 접속을 위한 인바운드 및 아웃바운드 정책을 재구성했습니다.

결과:
네트워크 보안 정책을 올바르게 이해하고 적용함으로써 서버 접속 문제를 즉각 해결했습니다.
팀 내에 SSH 접속 가이드와 방화벽 설정 메뉴얼을 공유하여, 향후 유사한 환경 구축 시 시행착오를 방지하도록 기여했습니다.



💡 개발 철학
"단순히 기능을 구현하는 것을 넘어, 쿼리의 병목 지점을 찾고 데이터의 흐름을 개선하는 데 희열을 느낍니다."
