;; ==============================================================================
;; PROJECT: Texas-Hannam Brick House
;; SCRIPT: Multi-Story Stepped Floorplan AutoLISP Generator
;; DESCRIPTION: Generates 1F, 2F, 3F floor plans for a stepped hillside house.
;; ==============================================================================

(defun c:DRAW_HANNAM_MULTI ()
  (setq old-osmode (getvar "OSMODE"))
  (setvar "OSMODE" 0)
  
  (princ "\n[INFO] Starting Hannam 3-Story Stepped Generation...\n")
  
  ;; --- LAYER SETUP ---
  (command "-LAYER" "M" "1F_WALLS" "C" "2" "" "")
  (command "-LAYER" "M" "2F_WALLS" "C" "3" "" "")
  (command "-LAYER" "M" "3F_WALLS" "C" "4" "" "")
  (command "-LAYER" "M" "STAIRS" "C" "8" "" "")
  (command "-LAYER" "M" "HVAC_MEP" "C" "1" "" "")
  (command "-LAYER" "M" "FURNITURE" "C" "5" "" "")

  ;; ==========================================
  ;; 1F: LIVING & PIANO & KITCHEN (Base Level)
  ;; ==========================================
  (command "-LAYER" "S" "1F_WALLS" "")
  ;; Base Rectangle (Width: 12000, Depth: 8000)
  (command "RECTANG" "0,0" "12000,8000")
  ;; Internal Walls
  (command "LINE" "8000,0" "8000,8000" "") ;; Divide Kitchen / Living
  
  ;; Stairs up to 2F (At the back of the house)
  (command "-LAYER" "S" "STAIRS" "")
  (command "RECTANG" "10000,6000" "12000,8000")
  (command "LINE" "10000,6500" "12000,6500" "")
  (command "LINE" "10000,7000" "12000,7000" "")
  (command "LINE" "10000,7500" "12000,7500" "")
  
  ;; 1F Furniture
  (command "-LAYER" "S" "FURNITURE" "")
  (command "CIRCLE" "4000,4000" "1500") ;; Living Area Rug
  (command "RECTANG" "1000,1000" "3000,2000") ;; Piano
  (command "RECTANG" "9000,2000" "11000,5000") ;; Kitchen Island

  ;; ==========================================
  ;; 2F: BEDROOM & STUDIO (Stepped back 4000mm)
  ;; ==========================================
  (command "-LAYER" "S" "2F_WALLS" "")
  ;; Shifted +4000 on Y-axis (Hillside step)
  (command "RECTANG" "0,4000" "12000,10000") 
  ;; Balcony Overlooking 1F Roof
  (command "-LAYER" "S" "FURNITURE" "")
  (command "LINE" "0,4000" "12000,4000" "") ;; Glass railing
  (command "RECTANG" "2000,5000" "4000,7000") ;; King Size Bed
  (command "RECTANG" "7000,5000" "11000,8000") ;; Studio Desk

  ;; ==========================================
  ;; 3F: LUXURY BATH (Stepped back 7000mm)
  ;; ==========================================
  (command "-LAYER" "S" "3F_WALLS" "")
  ;; Shifted +7000 on Y-axis
  (command "RECTANG" "0,7000" "8000,12000")
  
  ;; 3F Furniture
  (command "-LAYER" "S" "FURNITURE" "")
  (command "CIRCLE" "4000,9500" "1000") ;; Circular Bathtub
  (command "RECTANG" "1000,11000" "3000,11500") ;; Double Vanity

  ;; ==========================================
  ;; HVAC & MEP OVERLAY (All Floors)
  ;; ==========================================
  (command "-LAYER" "S" "HVAC_MEP" "")
  ;; Vertical Shaft
  (command "RECTANG" "11000,7000" "12000,8000") 
  (command "LINE" "11000,7000" "12000,8000" "")
  (command "LINE" "11000,8000" "12000,7000" "")
  
  ;; Duct running across 1F and 2F
  (command "PLINE" "11500,7500" "11500,6000" "6000,6000" "6000,4000" "")
  (command "PLINE" "11500,7500" "11500,9000" "4000,9000" "")

  (setvar "OSMODE" old-osmode)
  (princ "\n[SUCCESS] 3-Story Stepped LISP Generation Completed.\n")
  (princ)
)

(princ "\nLoaded DrawHannam_MultiFloor.lsp! Type DRAW_HANNAM_MULTI to execute.\n")
(princ)
