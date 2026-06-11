# 서현진 | Full-Stack Developer

데이터의 흐름을 설계하고, 비즈니스의 병목 지점을 해결하는 개발자 **서현진**입니다.
**"쿼리 최적화와 안정적인 시스템 아키텍처 설계"**에 강점이 있습니다.

---

## Tech Stack
* **Frontend**: React, Vue.js, Styled-components, Axios, SockJS, STOMP, jQuery, CSS
* **Backend**: Java(Spring Boot, Security), Node.js(Express)
* **Database**: MySQL, Redis, PostgreSQL, Oracle, MS-SQL
* **Tools**: Git, IntelliJ, Postman, VSCode

---

## 핵심 역량
* **Query Tuning**: 인덱스 설계 및 실행 계획 분석을 통한 쿼리 응답 속도 **98.4% 향상**
* **Caching Strategy**: Redis + Spring Scheduler를 이용한 데이터 조회 부하 최적화
* **Real-time System**: WebSocket/STOMP를 활용한 대규모 실시간 알림 아키텍처 설계
* **API Design**: RESTful 표준을 준수하는 확장 가능한 API 설계

---

## 주요 프로젝트

### [Sloway] : 워케이션 서비스
> **기간**: 2026.04 ~ 2026.06 | **역할**: DB설계 및 데이터베이스 최적화 담당
* **기능**: 공간/유닛 CRUD API 연동, 공간 검수 API 연동, 알림(공지, 채팅, 문의) CRUD API 연동
* **사용 기술**: Spring-boot, React, PostGres, Stomp.js, Redis, JPA/QueryDsl, KakaoMap Api

#### 트러블슈팅: 통계 조회 성능 최적화
* **문제 상황**: 통계 데이터 실시간 조회 시 평균 **28.3초** 소요 (최대 32.1초), 사용자 경험 저하 발생
* **1단계 개선 (쿼리 튜닝)**: 실행 계획 분석을 통한 인덱스 최적화 적용 (평균 12.4초로 단축)
* **2단계 개선 (캐싱 전략)**: **Materialized View** 방식 도입. Spring Scheduler를 활용해 10분 단위로 통계 데이터 갱신
* **결과**: 평균 **0.31초**로 단축 (약 98.9% 향상)


---

### [Task-Flow] : 프로젝트 일정 관리 서비스
> **기간**: 2026.02 ~ 2026.03 | **역할**: DBA
* **기능**: 프로젝트/마일스톤/회사/부서/사원 CRUD API 연동, Interceptor를 통한 권한 검증
* **사용 기술**: Spring-boot, Jsp, Oracle, MyBatis, JPA

#### 트러블슈팅: 권한 로직 개선을 통한 쿼리 성능 최적화
* **문제 상황**: '마일스톤은 담당자만' vs '체크리스트는 누구나'라는 권한 모호성으로 인해 체크리스트 조회 시 불필요한 **JOIN 발생 및 N+1 문제** 위험
* **해결 과정**: 팀원들과 협의하여 '권한의 일관성'을 우선순위로 설정. 프로젝트/부서 기반의 유저 생성 범위 제한 및 테이블 구조 재설계
* **결과**: JOIN 구조 단순화를 통해 쿼리 효율성 개선 및 보안성 강화

---

### [Trip-Tracks] : 여행 SNS 서비스
> **기간**: 2022.12 ~ 2023.10 | **역할**: 팀장, DBA, 백엔드 개발
* **기능**: 채팅을 제외한 전체 백엔드 기능 개발 및 API 설계
* **사용 기술**: Node.js, Express-session, Maria-DB, Socket.io

#### 트러블슈팅: SSH 인증 및 네트워크 방화벽 이슈 해결
* **문제 상황**: 실제 배포 환경에서 팀원 전원이 SSH 인증 프로세스 이해 부족으로 서버 접속 불가
* **해결 과정**: SSH 프로토콜과 방화벽 정책 리서치. 인바운드/아웃바운드 포트 정책 재구성
* **결과**: 서버 접속 문제 해결 및 SSH 접속 가이드/방화벽 설정 메뉴얼 배포를 통해 팀 기술 자산화


---

## 개발 철학
> *"단순히 기능을 구현하는 것을 넘어, 쿼리의 병목 지점을 찾고 데이터의 흐름을 개선하는 데 희열을 느낍니다."*
