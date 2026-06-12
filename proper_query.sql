-- Comprehensive Employee Performance and Status Report
-- Retrieves a list of active employees along with their department details,
-- total number of pending tasks, attendance statistics for the current month,
-- and their leave balance for the current year.

WITH task_stats AS (
    SELECT 
        "assigneeId",
        COUNT(id) AS total_pending_tasks
    FROM tasks
    WHERE status IN ('todo', 'in_progress')
    GROUP BY "assigneeId"
),
attendance_stats AS (
    SELECT 
        "employeeId",
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS days_present,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS days_late,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS days_absent
    FROM attendance_records
    WHERE EXTRACT(YEAR FROM date) = EXTRACT(YEAR FROM CURRENT_DATE) 
      AND EXTRACT(MONTH FROM date) = EXTRACT(MONTH FROM CURRENT_DATE)
    GROUP BY "employeeId"
),
leave_stats AS (
    SELECT 
        "employeeId",
        SUM(entitlement) AS total_leave_entitlement,
        SUM(used) AS total_leave_used,
        SUM(entitlement - used) AS remaining_leave_balance
    FROM leave_balances
    WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
    GROUP BY "employeeId"
)
SELECT 
    e.id AS employee_id,
    e."employeeCode" AS employee_code,
    e."fullName" AS full_name,
    e.designation,
    d.name AS department_name,
    COALESCE(t.total_pending_tasks, 0) AS pending_tasks,
    COALESCE(a.days_present, 0) AS days_present_this_month,
    COALESCE(a.days_late, 0) AS days_late_this_month,
    COALESCE(a.days_absent, 0) AS days_absent_this_month,
    COALESCE(l.remaining_leave_balance, 0) AS remaining_leaves_this_year
FROM employees e
LEFT JOIN departments d ON e."departmentId" = d.id
LEFT JOIN task_stats t ON e.id = t."assigneeId"
LEFT JOIN attendance_stats a ON e.id = a."employeeId"
LEFT JOIN leave_stats l ON e.id = l."employeeId"
WHERE e.status = 'active'
ORDER BY d.name, e."fullName";
