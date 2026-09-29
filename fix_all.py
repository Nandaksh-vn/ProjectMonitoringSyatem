import os
import re

# 1. Unused imports
unused_imports = {
    r"backend\src\main\java\com\infrawatch\controller\ReferenceDataController.java": [
        "import com.infrawatch.entity.Agency;",
        "import com.infrawatch.entity.Ministry;",
        "import com.infrawatch.entity.Sector;"
    ],
    r"backend\src\main\java\com\infrawatch\service\DataImportService.java": [
        "import org.springframework.transaction.annotation.Transactional;"
    ]
}

for path, imports in unused_imports.items():
    full_path = os.path.join(r"c:\Projects\ProjectManagement\ProjectMonitoringSyatem", path)
    if os.path.exists(full_path):
        with open(full_path, "r", encoding="utf-8") as f:
            content = f.read()
        for imp in imports:
            content = content.replace(imp + "\n", "")
            content = content.replace(imp + "\r\n", "")
            content = content.replace(imp, "")
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content)

# 2. Unnecessary @Repository
repos_dir = r"c:\Projects\ProjectManagement\ProjectMonitoringSyatem\backend\src\main\java\com\infrawatch\repository"
if os.path.exists(repos_dir):
    for f_name in os.listdir(repos_dir):
        if f_name.endswith(".java"):
            f_path = os.path.join(repos_dir, f_name)
            with open(f_path, "r", encoding="utf-8") as f:
                content = f.read()
            content = content.replace("@Repository\n", "")
            content = content.replace("@Repository\r\n", "")
            content = content.replace("import org.springframework.stereotype.Repository;\n", "")
            content = content.replace("import org.springframework.stereotype.Repository;\r\n", "")
            with open(f_path, "w", encoding="utf-8") as f:
                f.write(content)

# 3. Type safety in MlIntegrationService.java
ml_service_path = r"c:\Projects\ProjectManagement\ProjectMonitoringSyatem\backend\src\main\java\com\infrawatch\client\MlIntegrationService.java"
if os.path.exists(ml_service_path):
    with open(ml_service_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    for i, line in enumerate(lines):
        if "public Map<String, Object> checkHealth()" in line:
            if "@SuppressWarnings" not in lines[i-1]:
                lines.insert(i, "    @SuppressWarnings(\"unchecked\")\n")
            break
    with open(ml_service_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

# 4. Unused local variables
ai_service_path = r"c:\Projects\ProjectManagement\ProjectMonitoringSyatem\backend\src\main\java\com\infrawatch\service\AiAssistantService.java"
if os.path.exists(ai_service_path):
    with open(ai_service_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r'List<Alert>\s+alerts\s*=\s*', '', content)
    with open(ai_service_path, "w", encoding="utf-8") as f:
        f.write(content)

pred_sync_path = r"c:\Projects\ProjectManagement\ProjectMonitoringSyatem\backend\src\main\java\com\infrawatch\service\PredictionSyncService.java"
if os.path.exists(pred_sync_path):
    with open(pred_sync_path, "r", encoding="utf-8") as f:
        content = f.read()
    content = re.sub(r'ProjectMonthlyData\s+revised\s*=\s*', '', content)
    with open(pred_sync_path, "w", encoding="utf-8") as f:
        f.write(content)

print("Done phase 1")
