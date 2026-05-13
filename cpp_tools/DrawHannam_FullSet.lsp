;; ============================================================================
;; PROJECT: Texas-Hannam Brick House - FULL ARCHITECTURAL DRAWING SET
;; DESCRIPTION: 1F/2F/3F 평면도 + 정면입면도 + 측면입면도 + 단면도
;; USAGE: AutoCAD에서 DRAW_HANNAM_FULL 명령어 실행
;; ============================================================================
;; 설계 사양:
;;   - 층고: 2,400mm (각 층)
;;   - 구조: 북향 구릉지 계단식 3층 (Stepped Hillside)
;;   - 1F: 거실(Living) + 주방(Kitchen) - GL±0
;;   - 2F: 침실(Bedroom) + 스튜디오 - GL+2400, 후퇴 2000mm
;;   - 3F: 욕실(Luxury Bath) - GL+4800, 후퇴 4000mm
;;   - 외장: 텍사스산 적벽돌(Red Brick)
;;   - 남산 조망 최적화 (남측 대형 창호)
;; ============================================================================

(defun c:DRAW_HANNAM_FULL ()
  (setq old-osmode (getvar "OSMODE"))
  (setvar "OSMODE" 0)
  (princ "\n=== Hannam Full Drawing Set Generation ===\n")

  ;; --- LAYER SETUP ---
  (foreach lyr '(("1F_PLAN" "2") ("2F_PLAN" "3") ("3F_PLAN" "4")
                  ("ELEV_FRONT" "5") ("ELEV_SIDE" "6") ("SECTION" "1")
                  ("DIM" "8") ("FURNITURE" "9") ("HVAC" "1") ("STAIRS" "8")
                  ("HATCH" "7") ("TEXT" "7"))
    (command "-LAYER" "M" (car lyr) "C" (cadr lyr) "" "")
  )

  ;; ============================================================
  ;; SHEET 1: 1F 평면도 (Plan View) — Origin (0,0)
  ;; 거실 + 주방 + 현관 | 17500 x 8000mm
  ;; ============================================================
  (command "-LAYER" "S" "1F_PLAN" "")
  ;; Outer walls
  (command "RECTANG" "0,0" "17500,8000")
  ;; Internal partitions
  (command "LINE" "4800,0" "4800,8000" "")       ;; Kitchen | Dining divider
  (command "LINE" "9600,0" "9600,3800" "")        ;; Corridor wall south
  (command "LINE" "9600,4800" "9600,8000" "")     ;; Corridor wall north
  (command "LINE" "12100,0" "12100,8000" "")      ;; Bedroom zone start
  ;; Entry vestibule
  (command "RECTANG" "7800,0" "9600,1500")
  ;; Windows (W1=large, W2=standard)
  (command "-LAYER" "S" "DIM" "")
  (command "LINE" "1000,0" "3800,0" "")           ;; W1 south kitchen
  (command "LINE" "5800,0" "7800,0" "")           ;; W2 south dining
  (command "LINE" "0,2000" "0,6000" "")           ;; W1 west living
  (command "LINE" "13000,8000" "16000,8000" "")   ;; W1 north bedroom (남산뷰)
  ;; Door openings (arcs)
  (command "ARC" "9600,3800" "9100,4300" "9600,4800") ;; Corridor door

  ;; 1F Furniture
  (command "-LAYER" "S" "FURNITURE" "")
  (command "RECTANG" "1000,2000" "4000,5500")     ;; Kitchen Island
  (command "CIRCLE" "7200,4500" "1200")           ;; Dining Table (round)
  (command "RECTANG" "13500,1500" "16500,4500")   ;; Living Sofa L-shape
  (command "RECTANG" "14000,5500" "16000,7500")   ;; Piano

  ;; Stairs to 2F
  (command "-LAYER" "S" "STAIRS" "")
  (command "RECTANG" "10000,5500" "12000,8000")
  (setq sy 5500)
  (repeat 5
    (command "LINE"
      (strcat "10000," (itoa sy))
      (strcat "12000," (itoa sy)) "")
    (setq sy (+ sy 500))
  )

  ;; 1F Dimensions
  (command "-LAYER" "S" "DIM" "")
  (command "DIMLINEAR" "0,0" "17500,0" "0,-1500")      ;; Total width
  (command "DIMLINEAR" "0,0" "4800,0" "0,-800")         ;; Kitchen width
  (command "DIMLINEAR" "17500,0" "17500,8000" "19000,0") ;; Total depth

  ;; 1F Title
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC" "8750,-2500" "500" "0" "1F PLAN - GL±0 (Living & Kitchen)")

  ;; ============================================================
  ;; SHEET 2: 2F 평면도 — Offset Y+15000
  ;; 침실 + 스튜디오 | 13500 x 8000mm (후퇴 2000mm)
  ;; ============================================================
  (setq oy2 15000) ;; Y offset for 2F drawing
  (command "-LAYER" "S" "2F_PLAN" "")
  ;; Outer walls (stepped back: starts at X=2000)
  (command "RECTANG"
    (strcat "2000," (itoa oy2))
    (strcat "15500," (itoa (+ oy2 8000))))
  ;; Internal walls
  (command "LINE"
    (strcat "9000," (itoa oy2))
    (strcat "9000," (itoa (+ oy2 8000))) "")    ;; Bedroom | Studio divider
  ;; Closet
  (command "RECTANG"
    (strcat "9000," (itoa (+ oy2 5500)))
    (strcat "11500," (itoa (+ oy2 8000))))
  ;; Windows
  (command "-LAYER" "S" "DIM" "")
  (command "LINE"
    (strcat "3000," (itoa (+ oy2 8000)))
    (strcat "7000," (itoa (+ oy2 8000))) "")    ;; W1 north (남산뷰 Master BR)
  (command "LINE"
    (strcat "11500," (itoa (+ oy2 8000)))
    (strcat "14500," (itoa (+ oy2 8000))) "")   ;; W2 north studio

  ;; 2F Furniture
  (command "-LAYER" "S" "FURNITURE" "")
  (command "RECTANG"
    (strcat "3500," (itoa (+ oy2 2500)))
    (strcat "7500," (itoa (+ oy2 6000))))       ;; King Bed
  (command "RECTANG"
    (strcat "10000," (itoa (+ oy2 1000)))
    (strcat "14500," (itoa (+ oy2 4500))))      ;; Studio Desk

  ;; Stairs from 1F
  (command "-LAYER" "S" "STAIRS" "")
  (command "RECTANG"
    (strcat "12500," (itoa (+ oy2 5500)))
    (strcat "15000," (itoa (+ oy2 8000))))

  ;; Balcony (1F roof terrace)
  (command "-LAYER" "S" "2F_PLAN" "")
  (command "RECTANG"
    (strcat "0," (itoa oy2))
    (strcat "2000," (itoa (+ oy2 8000))))
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC"
    (strcat "1000," (itoa (+ oy2 4000))) "300" "0" "BALCONY")

  ;; 2F Dimensions
  (command "-LAYER" "S" "DIM" "")
  (command "DIMLINEAR"
    (strcat "2000," (itoa oy2))
    (strcat "15500," (itoa oy2))
    (strcat "0," (itoa (- oy2 1500))))

  ;; 2F Title
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC"
    (strcat "8750," (itoa (- oy2 2500))) "500" "0"
    "2F PLAN - GL+2400 (Bedroom & Studio)")

  ;; ============================================================
  ;; SHEET 3: 3F 평면도 — Offset Y+30000
  ;; 욕실 + 테라스 | 9500 x 6000mm (후퇴 4000mm)
  ;; ============================================================
  (setq oy3 30000)
  (command "-LAYER" "S" "3F_PLAN" "")
  (command "RECTANG"
    (strcat "4000," (itoa oy3))
    (strcat "13500," (itoa (+ oy3 6000))))
  ;; Partition: Bath | Laundry
  (command "LINE"
    (strcat "10000," (itoa oy3))
    (strcat "10000," (itoa (+ oy3 6000))) "")
  ;; Fixtures
  (command "-LAYER" "S" "FURNITURE" "")
  (command "CIRCLE"
    (strcat "7000," (itoa (+ oy3 3500))) "1000")  ;; Circular Bathtub
  (command "RECTANG"
    (strcat "4500," (itoa (+ oy3 500)))
    (strcat "6500," (itoa (+ oy3 1500))))          ;; Double Vanity
  (command "RECTANG"
    (strcat "10500," (itoa (+ oy3 1000)))
    (strcat "13000," (itoa (+ oy3 3000))))         ;; Washer/Dryer

  ;; Roof Terrace (2F roof)
  (command "-LAYER" "S" "3F_PLAN" "")
  (command "RECTANG"
    (strcat "0," (itoa oy3))
    (strcat "4000," (itoa (+ oy3 8000))))
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC"
    (strcat "2000," (itoa (+ oy3 4000))) "300" "0" "ROOF TERRACE")

  ;; 3F Title
  (command "TEXT" "J" "MC"
    (strcat "8750," (itoa (- oy3 2500))) "500" "0"
    "3F PLAN - GL+4800 (Luxury Bath)")

  ;; ============================================================
  ;; SHEET 4: 정면 입면도 (FRONT ELEVATION) — Offset X+25000
  ;; 남측에서 바라본 정면 (남산 방향)
  ;; ============================================================
  (setq ox_fe 25000)
  (command "-LAYER" "S" "ELEV_FRONT" "")

  ;; Ground Line (GL)
  (command "LINE"
    (strcat (itoa (- ox_fe 2000)) ",0")
    (strcat (itoa (+ ox_fe 20000)) ",0") "")

  ;; Hill slope (구릉 지형 경사)
  (command "PLINE"
    (strcat (itoa (- ox_fe 2000)) ",0")
    (strcat (itoa ox_fe) ",0")
    (strcat (itoa (+ ox_fe 6000)) ",2400")
    (strcat (itoa (+ ox_fe 10000)) ",4800")
    (strcat (itoa (+ ox_fe 20000)) ",4800") "")

  ;; 1F Facade (Full width 17500)
  (command "RECTANG"
    (strcat (itoa ox_fe) ",0")
    (strcat (itoa (+ ox_fe 17500)) ",2400"))

  ;; 2F Facade (Stepped back, width 13500, starts at X+2000)
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 2000)) ",2400")
    (strcat (itoa (+ ox_fe 15500)) ",4800"))

  ;; 3F Facade (Stepped back more, width 9500, starts at X+4000)
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 4000)) ",4800")
    (strcat (itoa (+ ox_fe 13500)) ",7200"))

  ;; Windows on elevation
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 1000)) ",300")
    (strcat (itoa (+ ox_fe 3800)) ",2000"))       ;; 1F W1
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 5800)) ",300")
    (strcat (itoa (+ ox_fe 7800)) ",2000"))       ;; 1F W2
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 13000)) ",300")
    (strcat (itoa (+ ox_fe 16500)) ",2000"))      ;; 1F W3 (large)
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 3000)) ",2700")
    (strcat (itoa (+ ox_fe 7000)) ",4500"))       ;; 2F W1 (Master BR 남산뷰)
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 11500)) ",2700")
    (strcat (itoa (+ ox_fe 14500)) ",4500"))      ;; 2F W2
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 5000)) ",5100")
    (strcat (itoa (+ ox_fe 9000)) ",6900"))       ;; 3F W1

  ;; Brick Hatch Pattern Indication
  (command "-LAYER" "S" "HATCH" "")
  (command "LINE"
    (strcat (itoa ox_fe) ",1200")
    (strcat (itoa (+ ox_fe 17500)) ",1200") "")   ;; Brick course line

  ;; Roof line (flat, parapet)
  (command "-LAYER" "S" "ELEV_FRONT" "")
  (command "LINE"
    (strcat (itoa (+ ox_fe 4000)) ",7200")
    (strcat (itoa (+ ox_fe 4000)) ",7500") "")    ;; Parapet left
  (command "LINE"
    (strcat (itoa (+ ox_fe 4000)) ",7500")
    (strcat (itoa (+ ox_fe 13500)) ",7500") "")   ;; Parapet top
  (command "LINE"
    (strcat (itoa (+ ox_fe 13500)) ",7500")
    (strcat (itoa (+ ox_fe 13500)) ",7200") "")   ;; Parapet right

  ;; Elevation dimensions
  (command "-LAYER" "S" "DIM" "")
  (command "DIMLINEAR"
    (strcat (itoa (+ ox_fe 17500)) ",0")
    (strcat (itoa (+ ox_fe 17500)) ",2400")
    (strcat (itoa (+ ox_fe 19500)) ",0"))         ;; 1F Height
  (command "DIMLINEAR"
    (strcat (itoa (+ ox_fe 15500)) ",2400")
    (strcat (itoa (+ ox_fe 15500)) ",4800")
    (strcat (itoa (+ ox_fe 19500)) ",0"))         ;; 2F Height
  (command "DIMLINEAR"
    (strcat (itoa (+ ox_fe 13500)) ",4800")
    (strcat (itoa (+ ox_fe 13500)) ",7200")
    (strcat (itoa (+ ox_fe 19500)) ",0"))         ;; 3F Height

  ;; Front Elevation Title
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC"
    (strcat (itoa (+ ox_fe 8750)) ",-2500") "500" "0"
    "FRONT ELEVATION (South / Namsan View)")

  ;; ============================================================
  ;; SHEET 5: 측면 입면도 (SIDE ELEVATION) — Offset X+25000, Y+15000
  ;; 서측에서 바라본 측면 → 계단식 단차 가시화
  ;; ============================================================
  (setq oy_se 15000)
  (command "-LAYER" "S" "ELEV_SIDE" "")

  ;; Ground + Hill slope
  (command "PLINE"
    (strcat (itoa (- ox_fe 2000)) "," (itoa oy_se))
    (strcat (itoa ox_fe) "," (itoa oy_se))
    (strcat (itoa (+ ox_fe 4000)) "," (itoa (+ oy_se 2400)))
    (strcat (itoa (+ ox_fe 6000)) "," (itoa (+ oy_se 4800)))
    (strcat (itoa (+ ox_fe 12000)) "," (itoa (+ oy_se 4800))) "")

  ;; 1F Side (Depth = 8000)
  (command "RECTANG"
    (strcat (itoa ox_fe) "," (itoa oy_se))
    (strcat (itoa (+ ox_fe 8000)) "," (itoa (+ oy_se 2400))))

  ;; 2F Side (Depth = 8000, stepped)
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 0)) "," (itoa (+ oy_se 2400)))
    (strcat (itoa (+ ox_fe 8000)) "," (itoa (+ oy_se 4800))))

  ;; 3F Side (Depth = 6000, stepped further)
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 0)) "," (itoa (+ oy_se 4800)))
    (strcat (itoa (+ ox_fe 6000)) "," (itoa (+ oy_se 7200))))

  ;; Side windows
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 1000)) "," (itoa (+ oy_se 300)))
    (strcat (itoa (+ ox_fe 3500)) "," (itoa (+ oy_se 2000))))
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 1000)) "," (itoa (+ oy_se 2700)))
    (strcat (itoa (+ ox_fe 3500)) "," (itoa (+ oy_se 4500))))
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 1000)) "," (itoa (+ oy_se 5100)))
    (strcat (itoa (+ ox_fe 3000)) "," (itoa (+ oy_se 6900))))

  ;; Roof terraces visible from side
  (command "LINE"
    (strcat (itoa (+ ox_fe 8000)) "," (itoa (+ oy_se 2400)))
    (strcat (itoa (+ ox_fe 10000)) "," (itoa (+ oy_se 2400))) "")  ;; 1F roof = 2F terrace
  (command "LINE"
    (strcat (itoa (+ ox_fe 6000)) "," (itoa (+ oy_se 4800)))
    (strcat (itoa (+ ox_fe 8000)) "," (itoa (+ oy_se 4800))) "")   ;; 2F roof = 3F terrace

  ;; Side Elevation Title
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC"
    (strcat (itoa (+ ox_fe 4000)) "," (itoa (- oy_se 2500))) "500" "0"
    "SIDE ELEVATION (West) - Stepped Hillside")

  ;; ============================================================
  ;; SHEET 6: 단면도 (SECTION CUT A-A) — Offset X+25000, Y+30000
  ;; 동서 방향 종단면 → 계단식 슬래브 + 내부 공간 표현
  ;; ============================================================
  (setq oy_sc 30000)
  (command "-LAYER" "S" "SECTION" "")

  ;; Hill profile
  (command "PLINE"
    (strcat (itoa (- ox_fe 2000)) "," (itoa oy_sc))
    (strcat (itoa ox_fe) "," (itoa oy_sc))
    (strcat (itoa (+ ox_fe 4000)) "," (itoa (+ oy_sc 2400)))
    (strcat (itoa (+ ox_fe 6000)) "," (itoa (+ oy_sc 4800)))
    (strcat (itoa (+ ox_fe 12000)) "," (itoa (+ oy_sc 4800))) "")

  ;; 1F Interior cut
  (command "RECTANG"
    (strcat (itoa ox_fe) "," (itoa oy_sc))
    (strcat (itoa (+ ox_fe 8000)) "," (itoa (+ oy_sc 2400))))
  ;; 1F Slab thickness (300mm)
  (command "RECTANG"
    (strcat (itoa ox_fe) "," (itoa (+ oy_sc 2400)))
    (strcat (itoa (+ ox_fe 8000)) "," (itoa (+ oy_sc 2700))))

  ;; 2F Interior cut
  (command "RECTANG"
    (strcat (itoa ox_fe) "," (itoa (+ oy_sc 2700)))
    (strcat (itoa (+ ox_fe 8000)) "," (itoa (+ oy_sc 5100))))
  ;; 2F Slab
  (command "RECTANG"
    (strcat (itoa ox_fe) "," (itoa (+ oy_sc 5100)))
    (strcat (itoa (+ ox_fe 6000)) "," (itoa (+ oy_sc 5400))))

  ;; 3F Interior cut
  (command "RECTANG"
    (strcat (itoa ox_fe) "," (itoa (+ oy_sc 5400)))
    (strcat (itoa (+ ox_fe 6000)) "," (itoa (+ oy_sc 7800))))

  ;; Floor labels inside section
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC"
    (strcat (itoa (+ ox_fe 4000)) "," (itoa (+ oy_sc 1200))) "350" "0"
    "1F: Living + Kitchen (H=2400)")
  (command "TEXT" "J" "MC"
    (strcat (itoa (+ ox_fe 4000)) "," (itoa (+ oy_sc 3900))) "350" "0"
    "2F: Bedroom + Studio (H=2400)")
  (command "TEXT" "J" "MC"
    (strcat (itoa (+ ox_fe 3000)) "," (itoa (+ oy_sc 6600))) "350" "0"
    "3F: Luxury Bath (H=2400)")

  ;; Section height dims
  (command "-LAYER" "S" "DIM" "")
  (command "DIMLINEAR"
    (strcat (itoa (- ox_fe 500)) "," (itoa oy_sc))
    (strcat (itoa (- ox_fe 500)) "," (itoa (+ oy_sc 2400)))
    (strcat (itoa (- ox_fe 2500)) ",0"))
  (command "DIMLINEAR"
    (strcat (itoa (- ox_fe 500)) "," (itoa (+ oy_sc 2700)))
    (strcat (itoa (- ox_fe 500)) "," (itoa (+ oy_sc 5100)))
    (strcat (itoa (- ox_fe 2500)) ",0"))
  (command "DIMLINEAR"
    (strcat (itoa (- ox_fe 500)) "," (itoa (+ oy_sc 5400)))
    (strcat (itoa (- ox_fe 500)) "," (itoa (+ oy_sc 7800)))
    (strcat (itoa (- ox_fe 2500)) ",0"))

  ;; Section Title
  (command "-LAYER" "S" "TEXT" "")
  (command "TEXT" "J" "MC"
    (strcat (itoa (+ ox_fe 4000)) "," (itoa (- oy_sc 2500))) "500" "0"
    "SECTION A-A (Longitudinal Cut)")

  ;; ============================================================
  ;; HVAC / MEP — Vertical Shaft on Section
  ;; ============================================================
  (command "-LAYER" "S" "HVAC" "")
  ;; Vertical duct shaft through all floors
  (command "RECTANG"
    (strcat (itoa (+ ox_fe 7200)) "," (itoa oy_sc))
    (strcat (itoa (+ ox_fe 7800)) "," (itoa (+ oy_sc 7800))))
  ;; X marks on shaft
  (command "LINE"
    (strcat (itoa (+ ox_fe 7200)) "," (itoa oy_sc))
    (strcat (itoa (+ ox_fe 7800)) "," (itoa (+ oy_sc 7800))) "")
  (command "LINE"
    (strcat (itoa (+ ox_fe 7800)) "," (itoa oy_sc))
    (strcat (itoa (+ ox_fe 7200)) "," (itoa (+ oy_sc 7800))) "")

  ;; ============================================================
  ;; DONE
  ;; ============================================================
  (command "ZOOM" "E")
  (setvar "OSMODE" old-osmode)
  (princ "\n=== [SUCCESS] Full Drawing Set Generated ===")
  (princ "\n  Sheet 1: 1F Plan  |  Sheet 2: 2F Plan  |  Sheet 3: 3F Plan")
  (princ "\n  Sheet 4: Front Elevation  |  Sheet 5: Side Elevation  |  Sheet 6: Section A-A")
  (princ)
)

(princ "\nLoaded DrawHannam_FullSet.lsp — Type DRAW_HANNAM_FULL to execute.\n")
(princ)
