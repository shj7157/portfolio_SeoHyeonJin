import React, { useState, useEffect } from "react";
import styled, { createGlobalStyle } from "styled-components";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// --- [공식 VS Code 아이콘들 임포트] ---
import {
  VscFiles,
  VscSearch,
  VscSourceControl,
  VscExtensions,
  VscAccount,
  VscSettingsGear,
  VscChevronDown,
  VscChevronRight,
  VscFolder,
  VscFolderOpened,
  VscSplitHorizontal,
  VscDatabase,
  VscMarkdown,
  VscChromeMinimize,
  VscChromeMaximize,
  VscChromeClose,
  VscBell,
  VscClose,
  VscFile,
  VscTerminal,
} from "react-icons/vsc";
import { FaJava, FaJsSquare } from "react-icons/fa"; // Java, JS 아이콘

// --- [전역 스타일] ---
const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #1e1e1e;
    color: #cccccc;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  }
`;

const projects = [
  {
    title: "Sloway",
    files: [
      {
        name: "통계 알고리즘.sql",
        type: "SQL",
        code: `-- 기존에 테이블이 있다면 삭제
DROP TABLE IF EXISTS place_summary;
-- 기존에 존재하는 Materialized view 삭제
DROP MATERIALIZED VIEW IF EXISTS place_summary;


-- Materialized View 생성
CREATE MATERIALIZED VIEW place_summary AS
WITH
RsvnStats AS (
    SELECT
        p.no as place_no,
        p.type,
        COUNT(DISTINCT r.no) AS rsvn_cnt,
        AVG(rev.score_total) AS avg_score
    FROM place p
    LEFT JOIN station s ON p.type = 'STATION' AND s.place_no = p.no
    LEFT JOIN office o ON p.type = 'OFFICE' AND o.place_no = p.no
    LEFT JOIN work_stay w ON p.type = 'WORK_STAY' AND w.place_no = p.no
    LEFT JOIN rsvn r ON (
        (p.type = 'STATION' AND r.station_no = s.no)
        OR (p.type = 'OFFICE' AND r.office_no = o.no)
        OR (p.type = 'WORK_STAY' AND r.work_stay_no = w.no)
    )
    LEFT JOIN review rev ON rev.rsvn_no = r.no
    GROUP BY p.no, p.type
),
ImgInfo AS (
    SELECT DISTINCT ON (place_no) place_no, current_url FROM img_place WHERE sort = 1
),
AmenityInfo AS (
    SELECT wa.work_no, STRING_AGG(a.name, ',') as names
    FROM work_amenity wa
    JOIN amenity a ON a.no = wa.amenity_no
    GROUP BY wa.work_no
)
SELECT
    p.no as place_no,
    p.type,
    MAX(CASE WHEN p.type = 'STATION' THEN s.no WHEN p.type = 'OFFICE' THEN o.no ELSE w.no END) as target_no,
    MAX(p.title || ' ' || COALESCE(s.title, o.title, w.title)) as title,
    MAX(p.address) as address,
    MAX(i.current_url) as current_url,
    MAX(COALESCE(s.mon_price, (SELECT MIN(op.price) FROM office_period op WHERE op.office_no = o.no AND op.exception_start_date IS NULL), w.mon_price, 0)) as price,
    MAX(ROUND(CASE WHEN COALESCE(rs.rsvn_cnt, 0) = 0 THEN 0.0 ELSE ((rs.rsvn_cnt * 0.7) + (rs.avg_score * 0.3)) * 100 END)::int) as final_score,
    MAX(COALESCE(rs.rsvn_cnt, 0)) as rsvn_count,
    MAX(COALESCE(rs.avg_score, 0.0)) as avg_score,
    MAX(am.names) as amenities,
    MAX(p.status) as status,
    NOW() as updated_at
FROM place p
         LEFT JOIN station s ON p.type = 'STATION' AND s.place_no = p.no
         LEFT JOIN office o ON p.type = 'OFFICE' AND o.place_no = p.no
         LEFT JOIN work_stay w ON p.type = 'WORK_STAY' AND w.place_no = p.no
         LEFT JOIN RsvnStats rs ON rs.place_no = p.no AND rs.type = p.type
         LEFT JOIN ImgInfo i ON i.place_no = p.no
         LEFT JOIN AmenityInfo am ON am.work_no = w.no
WHERE p.status = 'I'
GROUP BY p.no, p.type;

-- REFRESH CONCURRENTLY를 위한 인덱스 생성
CREATE UNIQUE INDEX idx_place_summary_unique ON place_summary (place_no, type);`,
        desc: `유닛의 예약, 리뷰 정보를 통계알고리즘을 통해 랭킹을 만들어 제공합니다.\n
        통계 데이터를 실시간으로 조회를 진행했을 시 최저 24.3초 최대 32.1초 평균값 28.3초가 소요되는 점을 발견했습니다.
        인덱스를 통한 튜닝 진행하여 최저 8.2초 최대 16.8초 평균 12.4초까지 속도를 개선했으나 사용자가 사용하기에 모자라다고 판단하여 캐싱을 진행했습니다.
        데이터베이스의 통계 조회용 테이블을 생성하여 진행하기보다는 통계값을 디스크에 직접 저장하여 조회속도가 더 빠른 materialized view를 활용하여 진행했습니다.
        스케쥴러를 통해 10분에 한번씩 값이 반영되도록 설계했습니다. 실시간성을 잃지만 조회 속도가 최저 0.24초 최대 0.38초 평균0.31초까지 개선되었습니다.

        첫번째 컴포넌트 알고리즘 : (총 예약건수 * 0.7 + (리뷰의 평균)*0.3)+(7일이내 신규 유닛의 경우: 0.5) *100
        두번째 컴포넌트 알고리즘 : (공간에 속한 유닛들의 총 예약건수 * 0.7 + (공간에 속한 유닛들의 리뷰의 평균)*0.3)+(7일이내 신규 공간의 경우: 0.5) *100
        세번째 컴포넌트 알고리즘 : (워크앤스테이라는 타입의 유닛의 총 예약건수 * 0.7 + (워크앤스테이라는 타입의 유닛의 리뷰의 평균)*0.3)+(7일이내 신규 워크앤스테이의 경우: 0.5) *100
        `,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_mainPage.png",
      },

      {
        name: "워크앤스테이 상세.java",
        type: "java",
        code: `@Override
    public StationDetailRespDto selectWorkStayDetailDashBoard(Long no, Long memberNo) {
        // 1. 기본 정보 및 대표 이미지 조회 (Tuple)
        Tuple tuple = fetchWorkStayBasicInfo(no, memberNo);

        if (tuple == null) {
            throw new IllegalArgumentException("해당 워케이션 정보를 찾을 수 없거나 권한이 없습니다. id=" + no);
        }

        // 2. 통계 카드 데이터 조회 (매출, 예약수, 평점)
        StationDetailRespDto.SummaryCard summary = fetchSummaryCard(no);

        // 3. 헤더 정보 및 상세 기본 정보 빌드
        StationDetailRespDto.HeaderInfo headerInfo = buildWorkStayHeaderInfo(tuple, summary);
        StationDetailRespDto.BasicInfo basicInfo = buildWorkStayBasicInfo(tuple);

        // 4. 편의시설 텍스트 리스트 조회
        List<String> facilities = fetchFacilities(no);

        // 5. 최근 예약 내역 조회 (최대 3건)
        List<StationDetailRespDto.RecentBooking> recentBookings = fetchRecentBookings(no);

        // 6.최종 대시보드 DTO 조립 반환
        return StationDetailRespDto.builder()
                .header(headerInfo)
                .basicInfo(basicInfo)
                .summary(summary)
                .facilities(facilities)
                .recentBookings(recentBookings)
                .build();
    }


    private Tuple fetchWorkStayBasicInfo(Long workStayId, Long memberNo) {
        // 1. 최신 HOST_PLACE ID 서브쿼리
        var latestHostPlaceIdSubQuery = JPAExpressions
                .select(hostPlaceEntity.no.max())
                .from(hostPlaceEntity)
                .where(hostPlaceEntity.workStayEntity.no.eq(workStayId));

        // 2. 쿼리 실행
        return queryFactory
                .select(
                        workStayEntity.title,
                        placeEntity.title,
                        placeEntity.type,
                        hostPlaceEntity.status,
                        placeEntity.address,
                        workStayEntity.maxCnt,
                        workStayEntity.cnt,
                        workStayEntity.monPrice,
                        workStayEntity.holPrice,
                        workStayEntity.checkinTime,
                        workStayEntity.checkoutTime,
                        imgWorkStayEntity.currentUrl
                )
                .from(workStayEntity)
                .join(placeEntity).on(placeEntity.no.eq(workStayEntity.placeEntity.no))
                .leftJoin(imgWorkStayEntity).on(imgWorkStayEntity.workStayEntity.no.eq(workStayId).and(imgWorkStayEntity.sort.eq(1)))
                .join(hostPlaceEntity).on(hostPlaceEntity.workStayEntity.no.eq(workStayEntity.no))
                .join(hostPlaceEntity.hostEntity, hostEntity)
                .where(
                        workStayEntity.no.eq(workStayId),
                        hostEntity.memberNo.eq(memberNo),
                        hostPlaceEntity.no.in(latestHostPlaceIdSubQuery)
                )
                .fetchOne();
    }

    private WorkStayUpdateDetailRespDto fetchWorkStayMainUpdateInfo(Long workStayId, Long memberNo) {
        // 1. 해당 워케이션의 가장 최신 HOST_PLACE ID 서브쿼리
        var latestHostPlaceIdSubQuery = JPAExpressions
                .select(hostPlaceEntity.no.max())
                .from(hostPlaceEntity)
                .where(hostPlaceEntity.workStayEntity.no.eq(workStayId));

        // 2. 쿼리 실행
        return queryFactory
                .select(Projections.fields(WorkStayUpdateDetailRespDto.class,
                        placeEntity.no.as("placeNo"),
                        placeEntity.title.as("placeTitle"),
                        workStayEntity.title,
                        workStayEntity.content,
                        workStayEntity.maxCnt.as("maxPeople"),
                        workStayEntity.cnt.as("basePeople"),
                        workStayEntity.rooms,
                        workStayEntity.checkinTime.as("checkIn"),
                        workStayEntity.checkoutTime.as("checkOut"),
                        workStayEntity.monPrice,
                        workStayEntity.tuePrice,
                        workStayEntity.wedPrice,
                        workStayEntity.thuPrice,
                        workStayEntity.friPrice,
                        workStayEntity.satPrice,
                        workStayEntity.sunPrice,
                        workStayEntity.holPrice
                ))
                .from(workStayEntity)
                .join(placeEntity).on(placeEntity.no.eq(workStayEntity.placeEntity.no))
                .join(hostPlaceEntity).on(
                        hostPlaceEntity.workStayEntity.eq(workStayEntity)
                                .and(hostPlaceEntity.no.in(latestHostPlaceIdSubQuery))
                )
                .where(
                        workStayEntity.no.eq(workStayId),
                        hostPlaceEntity.hostEntity.memberNo.eq(memberNo)
                )
                .fetchOne();
    }

    private StationDetailRespDto.SummaryCard fetchSummaryCard(Long workStayId) {
        YearMonth currentMonth = YearMonth.now();
        LocalDate startOfMonth = currentMonth.atDay(1);
        LocalDate endOfMonth = currentMonth.atEndOfMonth();

        // 1. 이번 달 예약 건수 및 매출 쿼리
        Tuple bookingStats = queryFactory
                .select(
                        rsvnEntity.no.count(),
                        rsvnEntity.amt.sum().coalesce(0) // SQL 레벨 null 방지
                )
                .from(rsvnEntity)
                .where(
                        rsvnEntity.workStayNo.no.eq(workStayId),
                        rsvnEntity.createdAt.between(startOfMonth.atStartOfDay(), endOfMonth.atTime(23, 59, 59)),
                        rsvnEntity.status.in(RsvnStatus.S, RsvnStatus.E)
                )
                .fetchOne();

        // 2. 총 리뷰 수 및 평균 평점 쿼리
        Tuple reviewStats = queryFactory
                .select(
                        reviewEntity.no.count(),
                        reviewEntity.scoreTotal.avg().coalesce(0.0) // SQL 레벨 null 방지
                )
                .from(reviewEntity)
                .where(reviewEntity.rsvnNo.workStayNo.no.eq(workStayId))
                .fetchOne();

        // 3. Tuple 객체 자체가 null인 경우 방어
        int monthlyBookings = 0;
        long monthlyRevenue = 0L;
        int totalReviews = 0;
        double averageRating = 0.0;

        // 3-1. 예약 통계 바인딩
        if (bookingStats != null) {
            Number bookingsValue = bookingStats.get(0, Number.class);
            Number revenueValue = bookingStats.get(1, Number.class);

            monthlyBookings = (bookingsValue != null) ? bookingsValue.intValue() : 0;
            monthlyRevenue = (revenueValue != null) ? revenueValue.longValue() : 0L;
        }

        // 3-2. 리뷰 통계 바인딩
        if (reviewStats != null) {
            Number reviewsValue = reviewStats.get(0, Number.class);
            Double ratingValue = reviewStats.get(1, Double.class);

            totalReviews = (reviewsValue != null) ? reviewsValue.intValue() : 0;
            averageRating = (ratingValue != null) ? Math.round(ratingValue * 10) / 10.0 : 0.0;
        }

        return StationDetailRespDto.SummaryCard.builder()
                .monthlyBookings(monthlyBookings)
                .monthlyRevenue(monthlyRevenue)
                .totalReviews(totalReviews)
                .averageRating(averageRating)
                .build();
    }

    private List<WorkStayUpdateDetailRespDto.AmenityDto> fetchWorkStayAmenities(Long workStayId) {
        return queryFactory
                .select(Projections.fields(WorkStayUpdateDetailRespDto.AmenityDto.class,
                        workAmenityEntity.amenityEntity.no.as("amenityNo")
                ))
                .from(workAmenityEntity)
                .where(workAmenityEntity.workStayEntity.no.eq(workStayId))
                .fetch();
    }

    private List<String> fetchFacilities(Long workStayId) {
        return queryFactory
                .select(workAmenityEntity.amenityEntity.name)
                .from(workAmenityEntity)
                .where(workAmenityEntity.workStayEntity.no.eq(workStayId))
                .fetch();
    }

    private List<WorkStayUpdateDetailRespDto.ExceptionPeriodDto> fetchExceptionPeriods(Long workStayId) {
        return queryFactory
                .select(Projections.fields(WorkStayUpdateDetailRespDto.ExceptionPeriodDto.class,
                        workExceptionPeriodEntity.startDate.as("startDate"),
                        workExceptionPeriodEntity.endDate.as("endDate"),
                        workExceptionPeriodEntity.monPrice.as("monPrice"),
                        workExceptionPeriodEntity.tuePrice.as("tuePrice"),
                        workExceptionPeriodEntity.wedPrice.as("wedPrice"),
                        workExceptionPeriodEntity.thuPrice.as("thuPrice"),
                        workExceptionPeriodEntity.friPrice.as("friPrice"),
                        workExceptionPeriodEntity.satPrice.as("satPrice"),
                        workExceptionPeriodEntity.sunPrice.as("sunPrice"),
                        workExceptionPeriodEntity.holPrice.as("holPrice")
                ))
                .from(workExceptionPeriodEntity)
                .where(workExceptionPeriodEntity.workStayEntity.no.eq(workStayId))
                .fetch();
    }

    private List<StationDetailRespDto.RecentBooking> fetchRecentBookings(Long workStayId) {
        return queryFactory
                .select(Projections.constructor(StationDetailRespDto.RecentBooking.class,
                        rsvnEntity.no,
                        memberEntity.imgUrl,
                        memberEntity.name,
                        rsvnEntity.no.as("bookingCode"),
                        rsvnEntity.checkIn.stringValue().concat("-").concat(rsvnEntity.checkOut.stringValue()),
                        rsvnEntity.amt
                ))
                .from(rsvnEntity)
                .join(memberEntity).on(rsvnEntity.memberNo.eq(memberEntity))
                .where(rsvnEntity.workStayNo.no.eq(workStayId))
                .orderBy(rsvnEntity.createdAt.desc())
                .limit(3)
                .fetch();
    }
`,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_workStayDetailPage.png",
        desc: `워크앤 스테이 상세조회 화면입니다.\n
          다중 Join이 발생하는 테이블 구조를 place_summary (Materialized View)로 구조화하여 조회 성능을 대폭 향상했습니다.
          또한, 쿼리 플랜 분석을 바탕으로 인덱스를 전략적으로 배치하여 데이터 조회 속도를 최적화했습니다.

          유닛의 상태(검수/운영) 필드를 도입하여 데이터 생명주기를 관리합니다. 
          특히, 검수 대기 상태에서는 수정 버튼을 조건부 렌더링하여 관리자의 승인 전 수정 시도를 방지하고 안정적인 운영을 유도했습니다.
        `,
      },
      {
        name: "검수상세 페이지.java",
        type: "java",
        code: `@Override
    public ApprovalDetailRespDto findWorkStayDetail(Long no) {
        // 1. 해당 워케이션에 대한 가장 최신 '대기중(P)'인 HOST_PLACE ID 서브쿼리
        var latestPendingHostPlaceIdSubQuery = JPAExpressions
                .select(hostPlaceEntity.no.max())
                .from(hostPlaceEntity)
                .where(hostPlaceEntity.workStayEntity.no.eq(no)
                        .and(hostPlaceEntity.status.eq(ApprovalStatus.P)));

        // 2. 쿼리 실행 (최신 이력 1건으로 고정)
        ApprovalDetailRespDto dto = queryFactory
                .select(Projections.constructor(ApprovalDetailRespDto.class,
                        hostPlaceEntity.no,
                        placeEntity.no,
                        placeEntity.type,
                        workStayEntity.title,
                        workStayEntity.content,
                        placeEntity.address,
                        memberEntity.name,
                        workStayEntity.monPrice,
                        workStayEntity.cnt,
                        workStayEntity.maxCnt,
                        workStayEntity.checkinTime,
                        workStayEntity.checkoutTime
                ))
                .from(workStayEntity)
                .join(workStayEntity.placeEntity, placeEntity)
                // 최신 대기 이력 1건만 조인
                .join(hostPlaceEntity).on(hostPlaceEntity.no.in(latestPendingHostPlaceIdSubQuery))
                .join(hostPlaceEntity.hostEntity, hostEntity)
                .join(memberEntity).on(memberEntity.no.eq(hostEntity.memberNo))
                .where(workStayEntity.no.eq(no))
                .fetchOne();

        // 3. 이미지 및 편의시설 데이터 주입
        if (dto != null) {
            dto.setImages(queryFactory
                    .select(Projections.constructor(ApprovalDetailRespDto.ImageDto.class,
                            imgWorkStayEntity.no, imgWorkStayEntity.currentUrl, imgWorkStayEntity.sort))
                    .from(imgWorkStayEntity)
                    .where(imgWorkStayEntity.workStayEntity.no.eq(no))
                    .fetch());

            dto.setSubImages(queryFactory
                    .select(Projections.constructor(ApprovalDetailRespDto.ImageDto.class,
                            imgWorkStayOfficeEntity.no, imgWorkStayOfficeEntity.currentUrl, imgWorkStayOfficeEntity.sort))
                    .from(imgWorkStayOfficeEntity)
                    .join(workOfficeEntity).on(imgWorkStayOfficeEntity.workOfficeEntity.eq(workOfficeEntity))
                    .where(workOfficeEntity.workStayEntity.no.eq(no))
                    .fetch());

            // 편의시설 조회 로직은 유지
            List<ApprovalDetailRespDto.AmenityDto> mainAmenities = queryFactory
                    .select(Projections.constructor(ApprovalDetailRespDto.AmenityDto.class,
                            workAmenityEntity.amenityEntity.no,
                            workAmenityEntity.amenityEntity.name))
                    .from(workAmenityEntity)
                    .where(workAmenityEntity.workStayEntity.no.eq(no))
                    .fetch();

            List<ApprovalDetailRespDto.AmenityDto> officeAmenities = queryFactory
                    .select(Projections.constructor(ApprovalDetailRespDto.AmenityDto.class,
                            workOfficeAmenityEntity.amenityEntity.no,
                            workOfficeAmenityEntity.amenityEntity.name))
                    .from(workOfficeAmenityEntity)
                    .join(workOfficeAmenityEntity.workOfficeEntity, workOfficeEntity)
                    .where(workOfficeEntity.workStayEntity.no.eq(no))
                    .fetch();

            List<ApprovalDetailRespDto.AmenityDto> combinedAmenities = new ArrayList<>(Stream.concat(mainAmenities.stream(), officeAmenities.stream())
                    .collect(Collectors.toMap(
                            ApprovalDetailRespDto.AmenityDto::getNo,
                            amenity -> amenity,
                            (existing, replacement) -> existing
                    ))
                    .values());

            dto.setAmenities(combinedAmenities);
        }
        return dto;
    }`,
        desc: `검수 상세 페이지입니다.\n
          클라우드 스토리지 활용: 유닛 이미지 데이터를 AWS S3 Bucket을 통해 관리하여 서버의 부하를 분산하고, 확장성 있는 미디어 처리 인프라를 구축했습니다.

          운영 품질 관리 (Quality Assurance): 검수 과정에서 사진 체크리스트 검증 로직을 강제하여, 호스트가 등록한 공간의 정보가 운영 기준을 충족했는지 체계적으로 확인하도록 설계했습니다.
          
          운영 무결성 확보: 모든 체크리스트 항목이 승인 조건에 부합해야만 검수 완료가 가능하도록 로직을 구현하여, 운영 데이터의 품질을 일관되게 유지합니다.
        `,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/sloway_approvalDetailPage.png",
      },
      {
        name: "회고.md",
        type: "md",
        code: `#  프로젝트 회고 

## 성능 최적화 및 데이터 조회 관련

### 좋았던 점
- 대용량 데이터 환경에서 조회 속도 저하 문제를 해결하기 위해 **Redis를 활용한 캐싱** 전략과 **데이터베이스 인덱스 튜닝**을 도입하여 쿼리 성능을 획기적으로 개선하는 값진 경험을 했습니다.
- 실행 계획(EXPLAIN)을 분석하여 병목이 생기는 테이블에 적절한 복합 인덱스를 설정하고, 자주 조회되는 정적 데이터는 캐시 레이어로 분리함으로써 DB 뷰(View) 및 복잡한 조건 검색의 응답 시간을 최대 수십 배 이상 단축했습니다.

### 아쉬운 점
- 초기 아키텍처 설계 단계에서 대용량 데이터 적재 및 고빈도 조회 상황을 정밀하게 예측하지 못해, 프로젝트 중반부에 특정 기능(조회/통계/랭킹 등)에서 심각한 데이터 조회 속도 저하 문제를 겪었습니다.

### 시도해볼 만한 점
- 향후 프로젝트에서는 초기 테이블 스키마 설계 단계부터 데이터 조회 빈도와 대략적인 볼륨을 미리 상정하여 인덱스 전략을 선제적으로 수립하겠습니다.
- 정합성 보장 로직을 더 정교하게 고도화하여 캐시 스탬피드 현상을 방지하는 구조를 도입해 보고 싶습니다.

---

## 팀 내부 소통 및 협의 관련

### 좋았던 점
- 기술적 이슈나 아키텍처 방향성에 대해 팀원 간의 활발한 피드백이 오갔으며, 서로의 의견을 존중하는 건강한 개발 문화 속에서 작업할 수 있었습니다.

### 아쉬운 점
- 개발을 진행하면서 특정 기능의 구현 방식이나 우선순위에 대해 **팀원 간에 생각하는 방향성과 관점이 달라** 초기 의견 조율 과정에서 다소 팽팽한 의견 대립이나 병목이 발생하기도 했습니다.

### 시도해볼 만한 점
- 각자 생각하는 방향성이 다를 때 고집을 부리기보다, **적극적인 기술 공유와 기술 문서 기반의 협의**를 통해 싱크를 맞췄습니다. 
  각 대안의 장단점을 객관적으로 비교 분석하여 팀 전체가 납득할 수 있는 최선의 합의점을 도출해 내는 프로세스를 정립했습니다.
- 다음 프로젝트에서는 기획 및 구체적인 스펙 확정 단계에서 화면 설계서나 API 명세를 더 세밀하게 맞추어, 싱크가 어긋나는 타이밍을 최소화하겠습니다.

---

## 회고를 마치며
단순히 기능 구현에 그치지 않고, 데이터 조회 성능 저하라는 실무적인 문제를 캐싱과 인덱스 튜닝을 통해 직접 돌파해 보며 백엔드 개발자로서 크게 성장할 수 있었던 프로젝트였습니다. 
또한, 팀원들과 서로 다른 방향성을 가지고 있을 때 감정 소모 없이 '협의와 데이터'를 통해 건강하게 조율해 나가는 커뮤니케이션의 중요성을 다시 한번 깊이 깨닫게 되었습니다.`,
        desc: "Sloway프로젝트에 대한 회고입니다.",
      },
      {
        name: "Sloway_트러블슈팅.md",
        type: "md",
        code: `# Trouble Shooting: 대용량 통계 데이터 조회 성능 최적화

## 1. 배경 및 문제 상황
서비스 내에서 대용량 데이터를 기반으로 대시보드 및 통계 데이터를 실시간으로 조회하는 기능이 있었습니다.
하지만 데이터 누적량이 증가함에 따라 **실시간 통계 조회 시 평균 28.3초, 심할 때는 최대 32.1초까지 소요되는 심각한 성능 저하 현상**이 발생했습니다. 

웹 서비스 환경에서 30초에 육박하는 응답 시간은 사용자에게 빈 화면이나 무한 로딩을 보여주게 되어 **사용자 경험(UX)을 치명적으로 해치고, 
브라우저의 Connection Timeout을 유발하는 화급한 리스크**였습니다. 시스템의 안정성과 유저 유지율을 위해 즉각적인 쿼리 및 아키텍처 개선이 필요했습니다.

---

## 2. 원인 분석 (Analysis)
성능 저하의 원인을 파악하기 위해 문제가 되는 통계 쿼리를 추출하여 **데이터베이스 실행 계획**을 분석했습니다. 

- **인덱스 부재 및 Full Table Scan:** 수많은 조인과 대규모 데이터 정렬, 그룹화가 복합적으로 일어나는 쿼리였음에도 불구하고,
    복합 인덱스가 제대로 설정되어 있지 않아 대량의 테이블을 처음부터 끝까지 읽는 Full Table Scan이 발생하고 있었습니다.
- **실시간 연산의 한계:** 매 요청마다 수백만 건에 달하는 로우를 실시간으로 집계하고 연산하는 구조 자체가 데이터베이스 CPU에 엄청난 과부하를 주고 있었습니다.

---

## 3. 단계별 개선 과정
단번에 구조를 바꾸기보다, 안정성을 위해 데이터베이스 레벨의 튜닝을 먼저 진행한 후 애플리케이션 레이어의 캐싱 전략을 도입하는 2단계 접근 방식을 취했습니다.

### [1단계] 쿼리 튜닝 및 인덱스 최적화
- **조치 내용:** \`EXPLAIN\` 분석 결과를 바탕으로, 쿼리 조건절과 그룹화에 자주 사용되는 핵심 컬럼들을 조합하여 **최적의 복합 인덱스**를 설계하고 반영했습니다.
- **결과:** 인덱스 스캔을 통해 불필요한 디스크 I/O를 대폭 줄였으며, 쿼리 자체의 실행 속도를 **평균 12.4초로 단축**시켰습니다. 
    약 2배 이상의 성능 향상을 이뤄냈으나, 여전히 사용자에게 실시간으로 제공하기에는 무거운 수치였습니다.

### [2단계] 캐싱 전략 및 데이터 구조화
- **조치 내용:** 통계 데이터의 특성상 '완벽한 실시간성(초 단위)'보다는 '정확한 주기별 집계(분 단위)'가 더 중요하다는 비즈니스적 판단을 내렸습니다. 
    이에 따라 매번 빈번한 대규모 연산을 수행하는 대신, 미리 집계된 데이터를 별도 테이블에 저장해두고 조회하는 **구체화 뷰 패턴**을 도입했습니다.
- **구현 방식:** **Spring Boot의 Scheduler(\`@Scheduled\`)** 기능을 활용하여, 10분 주기로 백그라운드에서 통계 배치 쿼리가 돌며 집계 테이블을 갱신하도록 아키텍처를 전면 리팩토링했습니다.
    사용자는 복잡한 연산 없이 배치로 다듬어진 결과 데이터만 즉시 읽어가도록 구조를 변경했습니다.

---

## 4. 최종 성과 및 결과
두 단계에 걸친 집요한 최적화 결과, 인프라 비용 추가 없이 놀라운 성능 개선을 이루어냈습니다.

- **조회 속도:** 평균 **28.3초 -> 0.31초**로 감소 (**약 98.9%의 성능 향상**)
- **사용자 경험 극대화:** 무한 로딩에 가깝던 통계 페이지가 클릭과 동시에 화면에 렌더링되는 쾌적한 환경을 구축했습니다.
- **시스템 안정성 확보:** 데이터베이스의 피크 타임 CPU 점유율을 현저히 낮추어, 다른 핵심 비즈니스 로직(주문, 등록 등)의 트랜잭션 안정성까지 동시에 확보하는 선순환 효과를 낳았습니다.

---

## 깨달은 점 
무조건적인 실시간 조회가 정답이 아니며, **서비스의 비즈니스 도메인 특성에 맞춰 데이터 정합성과 성능 사이의 트레이드오프(Trade-Off)를 
올바르게 조율하는 것이 백엔드 개발자의 핵심 역량**임을 깊이 깨닫게 된 뜻깊은 트러블슈팅 경험이었습니다.`,
        desc: "Sloway 프로젝트의 트러블슈팅 내용입니다.",
      },
    ],
  },
  {
    title: "Task-Flow",
    files: [
      {
        name: "프로젝트 업데이트.java",
        type: "java",
        code: `//project업데이트
        @Transactional
    public int update(ProjVo projVo, ProjEmplVo projEmplVo, ProjDeptVo projDeptVo, ProjScheVo projScheVo) {

        //project의 no값을 통해 조회
        String projNo = String.valueOf(projVo.getNo());
        //들어온 값의 유효성 검사 로직
        validateProj(projVo);
        //프로젝트 Update메서드
        updateProj(projVo);
        //담당부서 Update메서드
        updateProjDept(projDeptVo, projNo);
        //프로젝트 일정 Update메서드
        updateProjSche(projScheVo, projNo);

        projEmplVo.setProjNo(projNo);
        //담당자 체크를 위한 조회
        ProjEmplVo checkManagerY = projMapper.selectProjEmplVoByNo(projNo);

        if (checkManagerY == null) {
            insertNewManager(projEmplVo);
        } else {
            updateProjEmpl(projEmplVo, projNo);
        }

        return 1;
    }

    private int updateProj(ProjVo projVo) {
        int result = projMapper.updateProj(projVo);
        if (result != 1) {
            throw new IllegalArgumentException("[PROJ-301] Project UPDATE Error");
        }
        return result;
    }

    private int updateProjDept(ProjDeptVo projDeptVo, String projNo) {
        projDeptVo.setProjNo(projNo);
        int result = projMapper.updateProjDept(projDeptVo);
        if (result != 1) {
            throw new IllegalArgumentException("[PROJ-302] Project_DEPT UPDATE Error");
        }
        return result;
    }

    private int updateProjSche(ProjScheVo projScheVo, String projNo) {
        int result = projMapper.updateProjSche(projScheVo, projNo);
        if (result != 1) {
            throw new IllegalArgumentException("[PROJ-303] Project_SCHE UPDATE Error");
        }
        return result;
    }

    private int updateProjEmpl(ProjEmplVo projEmplVo, String projNo) {
        projEmplVo.setProjNo(projNo);
        int result = projMapper.updateProjEmpl(projEmplVo);
        if (result != 1) {
            throw new IllegalArgumentException("[PROJ-304] Project_EMPL UPDATE Error");
        }
        return result;
    }

    private int deleteMemberForUpdate(ProjEmplVo projEmplVo) {
        int result = projMapper.deleteMemberForUpdate(projEmplVo);
        if (result != 1) {
            throw new IllegalArgumentException("[PROJ-305] Project_EMPL DELETE Error");
        }
        return result;
    }

    private int insertNewManager(ProjEmplVo projEmplVo) {
        int result = projMapper.insertProjEmpl(projEmplVo);
        if (result < 1) {
            throw new IllegalArgumentException("[PROJ-306] Project_EMPL INSERT Error");
        }
        return result;
    }`,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/TaskFlow_MainPage.png",
        desc: `프로젝트를 업데이트하기 위한 페이지입니다.
          프로젝트 고유변호인 no값을 통한 조회로 유효성을 체크한 후, Project테이블의 정보들을 수정하고, 담당하는 부서를 변경합니다.
          프로젝트 일정도 삭제 후 재삽입 방식으로 갱신하며, 담당자를 지정하기위해 다대다 관계의 중계테이블을 참조하여 담당자 정보를 체크하여 수정합니다.
        `,
      },
      {
        name: "마일스톤 상세조회.sql",
        type: "sql",
        code: `@Select("""
                SELECT DISTINCT
                    M.NO
                    ,M.SCHE_NO       AS scheno
                    ,M.TITLE
                    ,M.CONTENT
                    ,M.LABEL
                    ,M.STATE
                    ,M.START_DATE    AS startDate
                    ,M.END_DATE      AS endDate
                    ,M.FOLLOWER_NO   AS followerNo
                    ,EM.NAME         AS followerName
                    ,PEME.NO         AS mileEmplNo
                    ,PEME.NAME       AS mileEmplName
                    ,PEPE.NO         AS projEmplNo   
                    ,PEPE.NAME       AS projEmplName
                FROM MILE M
                    LEFT JOIN EMPL EM
                        ON EM.NO = M.FOLLOWER_NO
                    INNER JOIN PROJ_EMPL PEM
                        ON PEM.MILE_NO = M.NO
                        AND PEM.IS_WRITER_YN = 'Y'
                            INNER JOIN EMPL PEME
                                ON PEME.NO = PEM.EMPL_NO
                    LEFT JOIN PROJ_EMPL PEP
                        ON PEP.PROJ_NO = #{projNo}
                        AND PEP.IS_MANAGER_YN = 'Y'
                            INNER JOIN EMPL PEPE
                                ON PEPE.NO = PEP.EMPL_NO
                WHERE M.DEL_AT IS NULL
                    AND M.NO = #{no}
            """)
    MileVo selectMileDetail(String projNo, String no);`,
        desc: `마일스톤 상세 조회를 위한 핵심 쿼리입니다.
  마일스톤과 담당 부서, 프로젝트 간의 데이터 무결성을 보장하기 위해 핵심 식별자 기반의 INNER JOIN 구조를 명확히 설계했습니다.
  담당자 정보 누락 없이 정확한 비즈니스 데이터를 결합하는 것을 최우선으로 고려했으며, 
  불필요한 Full Scan을 방지하고 조인 연산의 효율성을 극대화하기 위해 인덱스를 고려한 결합 조건을 적용했습니다.
        `,
        img: "https://kh0514-006116051973-ap-northeast-2-an.s3.ap-northeast-2.amazonaws.com/TaskFlow_MileStonePage.png",
      },
      {
        name: "Task_Flow_회고.md",
        type: "md",
        code: `# 프로젝트 회고

## 프로젝트 기간 및 일정 관리 회고
- **아쉬웠던 점:** 프로젝트 기간이 짧아 기획했던 모든 기능을 완벽하게 구현하는 데 어려움이 있었습니다. 
    특히 기능 간의 의존성을 사전에 면밀히 파악하지 못해 병목 현상이 발생했고, 이로 인해 팀원 간 구현 타이밍이 어긋나는 등 전체적인 완성도 측면에서 아쉬움이 남습니다.
- **배운 점:** 공동의 목표를 달성하기 위해 각자의 역할을 수행하며, 팀원들과 끊임없이 피드백을 교환하고 소통하는 과정의 중요성을 체득했습니다.

## 향후 개선 및 다짐
1. **체계적인 마일스톤 관리:** 기획 단계에서부터 기능 간의 선후 관계를 명확히 정의하고, 구현 순서에 우선순위를 부여하여 리스크를 최소화하겠습니다.
2. **주도적인 소통과 협업:** 중간 점검을 생활화하고 API/데이터 명세를 세밀하게 정의하여 싱크가 어긋나는 타이밍을 최소화하겠습니다.
3. **책임감 있는 개발자:** 이번 경험을 자양분 삼아, 앞으로는 더욱 체계적인 일정 관리와 주도적인 자세로 팀의 목표를 향해 기여하는 개발자로 성장하겠습니다.

---

## 💡 회고를 마치며
단순한 기능 구현을 넘어 시간 관리와 협업의 가치를 깊이 깨달은 소중한 시간이었습니다. 이번 프로젝트에서 얻은 교훈을 바탕으로, 앞으로 더 단단하고 책임감 있는 개발자가 되겠습니다.
        `,
        desc: "Task_Flow 프로젝트에 대한 회고입니다.",
      },
      {
        name: "트러블슈팅.md",
        type: "md",
        code: "해결...",
        desc: "권한 최적화",
      },
    ],
  },
  {
    title: "Trip-Tracks",
    files: [
      {
        name: "ChatController.java",
        type: "java",
        code: "...",
        desc: "채팅 관리",
      },
      {
        name: "RouteService.java",
        type: "java",
        code: "...",
        desc: "경로 관리",
      },
      { name: "Socket.js", type: "js", code: "...", desc: "실시간 통신" },
      { name: "Map.js", type: "js", code: "...", desc: "지도 API" },
      { name: "회고.md", type: "md", code: "회고...", desc: "회고" },
      {
        name: "트러블슈팅.md",
        type: "md",
        code: "해결...",
        desc: "네트워크 설정",
      },
    ],
  },
];
const getFileIcon = (name) => {
  if (name.endsWith(".java"))
    return <FaJava style={{ color: "#e66a05", fontSize: "15px" }} />;
  if (name.endsWith(".js"))
    return <FaJsSquare style={{ color: "#f1e05a", fontSize: "15px" }} />;
  if (name.endsWith(".sql"))
    return <VscDatabase style={{ color: "#e38c00", fontSize: "15px" }} />;
  if (name.endsWith(".md"))
    return <VscMarkdown style={{ color: "#007acc", fontSize: "15px" }} />;
  return <VscFile style={{ color: "#cccccc", fontSize: "15px" }} />;
};

// --- [메인 포트폴리오 컴포넌트] ---
export default function Portfolio() {
  const [activeProject, setActiveProject] = useState(projects[0].title);
  const [file, setFile] = useState(projects[0].files[0]);
  const [isCodeOpen, setIsCodeOpen] = useState(true);
  const [typedDesc, setTypedDesc] = useState("");

  const [openPkgs, setOpenPkgs] = useState({
    Sloway: true,
    "Task-Flow": true,
    "Trip-Tracks": true,
  });

  const togglePkg = (title) =>
    setOpenPkgs((prev) => ({ ...prev, [title]: !prev[title] }));

  const handleFileSelect = (pTitle, f) => {
    setActiveProject(pTitle);
    setFile(f);
  };

  useEffect(() => {
    setTypedDesc("");
    let i = 0;
    const descText = file.desc || "설명이 없습니다.";

    const charStep = 5;

    const typingInterval = setInterval(() => {
      setTypedDesc(descText.slice(0, i));
      i += charStep;

      if (i > descText.length + charStep) {
        setTypedDesc(descText);
        clearInterval(typingInterval);
      }
    }, 10);

    return () => clearInterval(typingInterval);
  }, [file]);

  return (
    <Layout>
      <GlobalStyle />

      {/* --- 상단 타이틀 바 --- */}
      <TitleBar>
        <div className="menus">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/9/9a/Visual_Studio_Code_1.35_icon.svg"
            alt="vscode"
            className="logo"
          />
          <span>File</span>
          <span>Edit</span>
          <span>Selection</span>
          <span>View</span>
          <span>Go</span>
          <span>Run</span>
          <span>Terminal</span>
          <span>Help</span>
        </div>
        <div className="title">
          {file.name} - Portfolio Workspace - Visual Studio Code
        </div>
        <div className="controls">
          <span className="ctrl-btn">
            <VscChromeMinimize />
          </span>
          <span className="ctrl-btn">
            <VscChromeMaximize />
          </span>
          <span className="ctrl-btn close">
            <VscChromeClose />
          </span>
        </div>
      </TitleBar>

      <AppCore>
        {/* --- 좌측 액티비티 바 --- */}
        <ActivityBar>
          <div className="icon active" title="Explorer">
            <VscFiles />
          </div>
          <div className="icon" title="Search">
            <VscSearch />
          </div>
          <div className="icon" title="Source Control">
            <VscSourceControl />
          </div>
          <div className="icon" title="Extensions">
            <VscExtensions />
          </div>
          <div className="spacer"></div>
          <div className="icon" title="Accounts">
            <VscAccount />
          </div>
          <div className="icon" title="Manage">
            <VscSettingsGear />
          </div>
        </ActivityBar>

        {/* --- 사이드바 --- */}
        <Sidebar>
          <SidebarTitle>EXPLORER</SidebarTitle>
          <SidebarSection>∨ PORTFOLIO WORKSPACE</SidebarSection>
          <div className="file-tree">
            {projects.map((p) => (
              <div key={p.title}>
                <PkgName onClick={() => togglePkg(p.title)}>
                  <span className="arrow">
                    {openPkgs[p.title] ? (
                      <VscChevronDown />
                    ) : (
                      <VscChevronRight />
                    )}
                  </span>
                  <span className="folder-icon">
                    {openPkgs[p.title] ? (
                      <VscFolderOpened style={{ color: "#dcb67a" }} />
                    ) : (
                      <VscFolder style={{ color: "#dcb67a" }} />
                    )}
                  </span>
                  {p.title}
                </PkgName>
                {openPkgs[p.title] &&
                  p.files.map((f) => (
                    <FileItem
                      key={f.name}
                      active={file.name === f.name}
                      onClick={() => handleFileSelect(p.title, f)}
                    >
                      <span className="f-icon">{getFileIcon(f.name)}</span>{" "}
                      {f.name}
                    </FileItem>
                  ))}
              </div>
            ))}
          </div>
        </Sidebar>

        <MainContainer>
          {/* --- 에디터 탭 --- */}
          <EditorTabs>
            <div className="tabs-wrapper">
              <Tab active>
                <span className="f-icon">{getFileIcon(file.name)}</span>
                <span className="f-name">{file.name}</span>
                <span className="f-close">
                  <VscClose />
                </span>
              </Tab>
            </div>
            {/* 이미지가 있을 때만 분할 뷰 토글 버튼을 활성화(표시)합니다 */}
            {file.img && (
              <HeaderActions>
                <ActionBtn
                  onClick={() => setIsCodeOpen(!isCodeOpen)}
                  title="Toggle Split View"
                >
                  <VscSplitHorizontal
                    style={{ fontSize: "16px", marginRight: "5px" }}
                  />
                  {isCodeOpen ? "코드 닫기" : "코드 열기"}
                </ActionBtn>
              </HeaderActions>
            )}
          </EditorTabs>

          <Breadcrumb>
            <span>Portfolio Workspace</span> &gt; <span>{activeProject}</span>{" "}
            &gt; <span>{file.name}</span>
          </Breadcrumb>

          {/* --- 메인 에디터 영역 (구조 변경) --- */}
          <EditorArea>
            {/* 1. 이미지가 있을 때만 이미지 프레뷰 섹션 렌더링 */}
            {file.img && (
              <ImageSection isCodeOpen={isCodeOpen}>
                <img src={file.img} alt="preview" />
              </ImageSection>
            )}

            {/* 2. 코드가 열려있거나, 혹은 이미지 자체가 없는 파일일 때는 무조건 코드 영역 렌더링 */}
            {(isCodeOpen || !file.img) && (
              <CodeSection hasImage={!!file.img}>
                <SyntaxHighlighter
                  language={
                    file.type === "java"
                      ? "java"
                      : file.type === "SQL"
                        ? "sql"
                        : file.type === "markdown"
                          ? "markdown"
                          : "javascript"
                  }
                  style={vscDarkPlus}
                  showLineNumbers={true}
                  wrapLines={true}
                  customStyle={{
                    background: "transparent",
                    margin: 0,
                    padding: "15px 20px",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {file.code}
                </SyntaxHighlighter>
              </CodeSection>
            )}
          </EditorArea>

          {/* --- 하단 터미널 영역 --- */}
          <ConsoleArea>
            <TerminalTabs>
              <span className="inactive">PROBLEMS</span>
              <span className="inactive">OUTPUT</span>
              <span className="inactive">DEBUG CONSOLE</span>
              <span className="active">
                <VscTerminal
                  style={{ verticalAlign: "middle", marginRight: "4px" }}
                />
                TERMINAL
              </span>
            </TerminalTabs>
            <TerminalContent>
              <div className="prompt">
                <span className="path">portfolio@macbook</span>{" "}
                <span className="colon">:</span>{" "}
                <span className="dir">~/{activeProject}</span>$ ./explain.sh{" "}
                {file.name}
              </div>
              <div className="output">
                {typedDesc}
                <span className="cursor">█</span>
              </div>
            </TerminalContent>
          </ConsoleArea>
        </MainContainer>
      </AppCore>

      {/* --- 최하단 상태 표시줄 --- */}
      <StatusBar>
        <div className="left">
          <span className="item remote">{"><"}</span>
          <span className="item">
            <VscSourceControl
              style={{ verticalAlign: "middle", marginRight: "4px" }}
            />
            main*
          </span>
          <span className="item">❌ 0 ⚠️ 0</span>
        </div>
        <div className="right">
          <span className="item">Ln 1, Col 1</span>
          <span className="item">Spaces: 2</span>
          <span className="item">UTF-8</span>
          <span className="item">{(file.type || "").toUpperCase()}</span>
          <span className="item">Prettier ✅</span>
          <span className="item">
            <VscBell />
          </span>
        </div>
      </StatusBar>
    </Layout>
  );
}

// --- [스타일 컴포넌트] ---
const Layout = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
  background: #1e1e1e;
`;

const TitleBar = styled.div`
  height: 30px;
  background: #181818;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #2b2b2b;
  user-select: none;
  position: relative;
  .menus {
    display: flex;
    align-items: center;
    font-size: 13px;
    color: #cccccc;
    .logo {
      width: 16px;
      height: 16px;
      margin: 0 10px;
    }
    span {
      padding: 4px 8px;
      cursor: pointer;
      &:hover {
        background: #333333;
        border-radius: 4px;
      }
    }
  }
  .title {
    font-size: 12px;
    color: #999999;
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
  .controls {
    display: flex;
    height: 100%;
    .ctrl-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 45px;
      height: 100%;
      cursor: pointer;
      font-size: 12px;
      color: #ccc;
      &:hover {
        background: #333333;
      }
      &.close:hover {
        background: #e81123;
        color: white;
      }
    }
  }
`;

const AppCore = styled.div`
  display: flex;
  flex: 1;
  height: calc(100vh - 52px);
`;

const ActivityBar = styled.div`
  width: 48px;
  background: #333333;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 10px;
  .icon {
    font-size: 22px;
    margin-bottom: 15px;
    cursor: pointer;
    opacity: 0.4;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 40px;
    &:hover {
      opacity: 1;
    }
    &.active {
      opacity: 1;
      border-left: 2px solid #007acc;
      color: #007acc;
    }
  }
  .spacer {
    flex: 1;
  }
`;

const Sidebar = styled.nav`
  width: 250px;
  background: #252526;
  border-right: 1px solid #1e1e1e;
  display: flex;
  flex-direction: column;
  .file-tree {
    flex: 1;
    overflow-y: auto;
    &::-webkit-scrollbar {
      width: 10px;
    }
    &::-webkit-scrollbar-thumb {
      background: #464646;
      border: 2px solid #252526;
      border-radius: 5px;
    }
  }
`;

const SidebarTitle = styled.div`
  padding: 15px 20px 10px 20px;
  font-size: 11px;
  color: #bbbbbb;
  letter-spacing: 1px;
`;
const SidebarSection = styled.div`
  padding: 5px 10px;
  font-size: 11px;
  font-weight: bold;
  color: #cccccc;
  background: #2a2d2e;
  cursor: pointer;
`;

const PkgName = styled.div`
  padding: 6px 10px;
  cursor: pointer;
  font-size: 13px;
  font-weight: bold;
  color: #cccccc;
  display: flex;
  align-items: center;
  gap: 6px;
  &:hover {
    background: #2a2d2e;
  }
  .arrow {
    display: flex;
    align-items: center;
    font-size: 12px;
    color: #aaa;
  }
  .folder-icon {
    display: flex;
    align-items: center;
    font-size: 16px;
  }
`;

const FileItem = styled.div`
  padding: 5px 10px 5px 35px;
  cursor: pointer;
  font-size: 13px;
  color: ${(props) => (props.active ? "#ffffff" : "#cccccc")};
  background: ${(props) => (props.active ? "#37373d" : "transparent")};
  border-left: 1px solid
    ${(props) => (props.active ? "#007acc" : "transparent")};
  display: flex;
  align-items: center;
  gap: 8px;
  &:hover {
    background: ${(props) => (props.active ? "#37373d" : "#2a2d2e")};
  }
  .f-icon {
    display: flex;
    align-items: center;
  }
`;

const MainContainer = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const EditorTabs = styled.div`
  display: flex;
  background: #252526;
  height: 35px;
  justify-content: space-between;
  overflow: hidden;
  .tabs-wrapper {
    display: flex;
    flex: 1;
    overflow-x: auto;
    &::-webkit-scrollbar {
      height: 0;
    }
  }
`;

const Tab = styled.div`
  background: #1e1e1e;
  color: #ffffff;
  border-top: 1px solid #007acc;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  min-width: 150px;
  border-right: 1px solid #252526;
  .f-icon {
    display: flex;
    align-items: center;
  }
  .f-close {
    display: flex;
    align-items: center;
    font-size: 14px;
    opacity: 0;
    transition: 0.2s;
    border-radius: 4px;
    padding: 2px;
    margin-left: auto;
    color: #aaa;
  }
  &:hover .f-close {
    opacity: 1;
  }
  .f-close:hover {
    background: #333;
    color: #fff;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  padding: 0 10px;
  background: #252526;
`;
const ActionBtn = styled.button`
  background: transparent;
  color: #cccccc;
  border: none;
  cursor: pointer;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  &:hover {
    background: #333333;
    color: white;
  }
`;

const Breadcrumb = styled.div`
  padding: 4px 15px;
  font-size: 12px;
  color: #999;
  background: #1e1e1e;
  border-bottom: 1px solid #2b2b2b;
  span {
    cursor: pointer;
    &:hover {
      color: #ccc;
      text-decoration: underline;
    }
  }
`;

const EditorArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const ImageSection = styled.div`
  flex: 1;
  background: #1e1e1e;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  border-right: ${(props) => (props.isCodeOpen ? "1px solid #2b2b2b" : "none")};
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  }
`;

const CodeSection = styled.div`
  /* 이미지가 있으면 50% 분할 레이아웃, 없으면 전체(100%) 레이아웃 */
  width: ${(props) => (props.hasImage ? "50%" : "100%")};
  max-width: ${(props) => (props.hasImage ? "600px" : "none")};
  background: #1e1e1e;
  overflow-y: auto;
  overflow-x: hidden;
  &::-webkit-scrollbar {
    width: 14px;
  }
  &::-webkit-scrollbar-thumb {
    background: #464646;
    border: 4px solid #1e1e1e;
    border-radius: 8px;
  }
`;

const ConsoleArea = styled.div`
  height: 280px;
  background: #1e1e1e;
  border-top: 1px solid #2b2b2b;
  display: flex;
  flex-direction: column;
`;

const TerminalTabs = styled.div`
  display: flex;
  padding: 0 20px;
  gap: 20px;
  border-bottom: 1px solid #2b2b2b;
  span {
    padding: 8px 0;
    font-size: 11px;
    cursor: pointer;
    letter-spacing: 0.5px;
    font-family: "Segoe UI", sans-serif;
    display: flex;
    align-items: center;
    &.active {
      color: #e7e7e7;
      border-bottom: 1px solid #e7e7e7;
    }
    &.inactive {
      color: #888;
    }
    &:hover {
      color: #ccc;
    }
  }
`;

const TerminalContent = styled.div`
  padding: 10px 20px;
  overflow-y: auto;
  flex: 1;
  font-family: "Consolas", "Courier New", monospace;
  &::-webkit-scrollbar {
    width: 14px;
  }
  &::-webkit-scrollbar-thumb {
    background: #464646;
    border: 4px solid #1e1e1e;
    border-radius: 8px;
  }
  .prompt {
    font-size: 13px;
    color: #cccccc;
    margin-bottom: 8px;
    .path {
      color: #50fa7b;
      font-weight: bold;
    }
    .colon {
      color: #f8f8f2;
    }
    .dir {
      color: #8be9fd;
      font-weight: bold;
    }
  }
  .output {
    font-size: 13px;
    color: #cccccc;
    white-space: pre-wrap;
    line-height: 1.6;
    .cursor {
      animation: blink 1s step-end infinite;
      color: #cccccc;
    }
  }
  @keyframes blink {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0;
    }
  }
`;

const StatusBar = styled.div`
  height: 22px;
  background: #007acc;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: white;
  padding: 0 10px;
  font-family: "Segoe UI", sans-serif;
  cursor: default;
  user-select: none;
  .left,
  .right {
    display: flex;
    align-items: center;
    gap: 15px;
    height: 100%;
  }
  .item {
    display: flex;
    align-items: center;
    cursor: pointer;
    height: 100%;
    padding: 0 4px;
    &:hover {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 2px;
    }
  }
  .remote {
    background: #16825d;
    padding: 0 8px;
    height: 100%;
    display: flex;
    align-items: center;
    margin-left: -10px;
    font-weight: bold;
  }
`;
