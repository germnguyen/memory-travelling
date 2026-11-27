package com.travelling.memory.bootstrap;

import com.travelling.memory.domain.Province;
import com.travelling.memory.repository.ProvinceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class ProvinceDataSeeder implements CommandLineRunner {

    private final ProvinceRepository provinceRepository;

    @Override
    public void run(String... args) {
        if (provinceRepository.count() > 0) {
            log.info("Provinces already seeded: {} entries found.", provinceRepository.count());
            return;
        }

        log.info("Seeding 63 provinces of Vietnam into master data...");
        List<Province> provinces = List.of(
            // Miền Bắc (25)
            p(1, "HA_NOI", "Hà Nội", "Bắc", 21.0285, 105.8542),
            p(2, "HA_GIANG", "Hà Giang", "Bắc", 22.8233, 104.9839),
            p(3, "CAO_BANG", "Cao Bằng", "Bắc", 22.6669, 106.2639),
            p(4, "BAC_KAN", "Bắc Kạn", "Bắc", 22.1472, 105.8344),
            p(5, "TUYEN_QUANG", "Tuyên Quang", "Bắc", 21.8231, 105.2144),
            p(6, "LAO_CAI", "Lào Cai", "Bắc", 22.4856, 103.9707),
            p(7, "DIEN_BIEN", "Điện Biên", "Bắc", 21.3869, 103.0231),
            p(8, "LAI_CHAU", "Lai Châu", "Bắc", 22.3964, 103.4684),
            p(9, "SON_LA", "Sơn La", "Bắc", 21.3283, 103.9144),
            p(10, "YEN_BAI", "Yên Bái", "Bắc", 21.7168, 104.8967),
            p(11, "HOA_BINH", "Hoà Bình", "Bắc", 20.8172, 105.3383),
            p(12, "THAI_NGUYEN", "Thái Nguyên", "Bắc", 21.5942, 105.8481),
            p(13, "LANG_SON", "Lạng Sơn", "Bắc", 21.8536, 106.7618),
            p(14, "QUANG_NINH", "Quảng Ninh", "Bắc", 20.9505, 107.0734),
            p(15, "BAC_GIANG", "Bắc Giang", "Bắc", 21.2731, 106.1947),
            p(16, "PHU_THO", "Phú Thọ", "Bắc", 21.3228, 105.2280),
            p(17, "VINH_PHUC", "Vĩnh Phúc", "Bắc", 21.3609, 105.5474),
            p(18, "BAC_NINH", "Bắc Ninh", "Bắc", 21.1861, 106.0763),
            p(19, "HAI_DUONG", "Hải Dương", "Bắc", 20.9386, 106.3157),
            p(20, "HAI_PHONG", "Hải Phòng", "Bắc", 20.8449, 106.6881),
            p(21, "HUNG_YEN", "Hưng Yên", "Bắc", 20.6464, 106.0511),
            p(22, "THAI_BINH", "Thái Bình", "Bắc", 20.4463, 106.3366),
            p(23, "HA_NAM", "Hà Nam", "Bắc", 20.5843, 105.9224),
            p(24, "NAM_DINH", "Nam Định", "Bắc", 20.4369, 106.1772),
            p(25, "NINH_BINH", "Ninh Bình", "Bắc", 20.2506, 105.9745),

            // Miền Trung & Tây Nguyên (19)
            p(26, "THANH_HOA", "Thanh Hóa", "Trung", 19.8067, 105.7852),
            p(27, "NGHE_AN", "Nghệ An", "Trung", 19.2343, 104.9200),
            p(28, "HA_TINH", "Hà Tĩnh", "Trung", 18.3429, 105.9059),
            p(29, "QUANG_BINH", "Quảng Bình", "Trung", 17.4690, 106.6224),
            p(30, "QUANG_TRI", "Quảng Trị", "Trung", 16.8167, 107.1000),
            p(31, "THUA_THIEN_HUE", "Thừa Thiên Huế", "Trung", 16.4637, 107.5909),
            p(32, "DA_NANG", "Đà Nẵng", "Trung", 16.0544, 108.2022),
            p(33, "QUANG_NAM", "Quảng Nam", "Trung", 15.5394, 108.0191),
            p(34, "QUANG_NGAI", "Quảng Ngãi", "Trung", 15.1214, 108.7924),
            p(35, "BINH_DINH", "Bình Định", "Trung", 14.1667, 108.9000),
            p(36, "PHU_YEN", "Phú Yên", "Trung", 13.0882, 109.0927),
            p(37, "KHANH_HOA", "Khánh Hòa", "Trung", 12.2388, 109.1967),
            p(38, "NINH_THUAN", "Ninh Thuận", "Trung", 11.6969, 108.8928),
            p(39, "BINH_THUAN", "Bình Thuận", "Trung", 11.0903, 108.0722),
            p(40, "KON_TUM", "Kon Tum", "Trung", 14.3542, 108.0078),
            p(41, "GIA_LAI", "Gia Lai", "Trung", 13.9833, 108.0000),
            p(42, "DAK_LAK", "Đắk Lắk", "Trung", 12.6667, 108.0333),
            p(43, "DAK_NONG", "Đắk Nông", "Trung", 12.0000, 107.6833),
            p(44, "LAM_DONG", "Lâm Đồng", "Trung", 11.9404, 108.4583),

            // Miền Nam (19)
            p(45, "HO_CHI_MINH", "TP. Hồ Chí Minh", "Nam", 10.8231, 106.6297),
            p(46, "BINH_PHUOC", "Bình Phước", "Nam", 11.7511, 106.7233),
            p(47, "TAY_NINH", "Tây Ninh", "Nam", 11.3104, 106.0983),
            p(48, "BINH_DUONG", "Bình Dương", "Nam", 11.1667, 106.6667),
            p(49, "DONG_NAI", "Đồng Nai", "Nam", 11.0500, 107.0167),
            p(50, "BA_RIA_VUNG_TAU", "Bà Rịa - Vũng Tàu", "Nam", 10.5425, 107.2425),
            p(51, "LONG_AN", "Long An", "Nam", 10.5333, 106.4000),
            p(52, "TIEN_GIANG", "Tiền Giang", "Nam", 10.4167, 106.3333),
            p(53, "BEN_TRE", "Bến Tre", "Nam", 10.2433, 106.3756),
            p(54, "TRA_VINH", "Trà Vinh", "Nam", 9.9347, 106.3453),
            p(55, "VINH_LONG", "Vĩnh Long", "Nam", 10.2537, 105.9722),
            p(56, "DONG_THAP", "Đồng Tháp", "Nam", 10.4578, 105.6331),
            p(57, "AN_GIANG", "An Giang", "Nam", 10.5216, 105.1259),
            p(58, "KIEN_GIANG", "Kiên Giang", "Nam", 10.0125, 105.0809),
            p(59, "CAN_THO", "Cần Thơ", "Nam", 10.0452, 105.7469),
            p(60, "HAU_GIANG", "Hậu Giang", "Nam", 9.7833, 105.4667),
            p(61, "SOC_TRANG", "Sóc Trăng", "Nam", 9.6033, 105.9800),
            p(62, "BAC_LIEU", "Bạc Liêu", "Nam", 9.2941, 105.7278),
            p(63, "CA_MAU", "Cà Mau", "Nam", 9.1769, 105.1524)
        );

        provinceRepository.saveAll(provinces);
        log.info("Successfully seeded all {} provinces of Vietnam.", provinces.size());
    }

    private static Province p(int id, String code, String name, String region, double lat, double lng) {
        return Province.builder()
            .id(id)
            .code(code)
            .name(name)
            .region(region)
            .latitude(lat)
            .longitude(lng)
            .build();
    }
}

