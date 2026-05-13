; AutoCAD LISP for 16-inch Stud Placement
(defun c:STUD ( / p1 p2 ang dist count)
  (setq p1 (getpoint "\n벽 시작점 클릭: "))
  (setq p2 (getpoint p1 "\n벽 끝점 클릭: "))
  (setq ang (angle p1 p2))
  (setq dist (distance p1 p2))
  (setq count 0)

  ; 406mm(16인치) 간격으로 반복 생성
  (while (<= (* count 406) dist)
    (command "_.RECTANG" 
      (polar p1 ang (* count 406)) 
      (polar (polar p1 ang (+ (* count 406) 38)) (+ ang (/ pi 2)) 89) ; 2x4 규격 예시
    )
    (setq count (1+ count))
  )
  (princ)
)
(princ "\nLoad complete. Type 'STUD' to start.")
