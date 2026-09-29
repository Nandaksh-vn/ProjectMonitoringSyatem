import os
import re

files_to_fix = [
    r"backend\src\main\java\com\infrawatch\controller\AiAssistantController.java",
    r"backend\src\main\java\com\infrawatch\controller\AlertController.java",
    r"backend\src\main\java\com\infrawatch\controller\AuthController.java",
    r"backend\src\main\java\com\infrawatch\controller\DashboardController.java",
    r"backend\src\main\java\com\infrawatch\controller\ProjectController.java",
    r"backend\src\main\java\com\infrawatch\controller\PublicController.java",
    r"backend\src\main\java\com\infrawatch\security\CustomUserDetailsService.java",
    r"backend\src\main\java\com\infrawatch\security\JwtAuthenticationFilter.java",
    r"backend\src\main\java\com\infrawatch\service\AiAssistantService.java",
    r"backend\src\main\java\com\infrawatch\service\EmailService.java",
    r"backend\src\main\java\com\infrawatch\service\ProjectService.java",
    r"backend\src\main\java\com\infrawatch\service\RecommendationEngineService.java",
]

for rel_path in files_to_fix:
    full_path = os.path.join(r"c:\Projects\ProjectManagement\ProjectMonitoringSyatem", rel_path)
    if not os.path.exists(full_path):
        continue
    
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # 1. Remove @Autowired and make fields final
    # Pattern: @Autowired\s*(?:\r\n|\n)\s*private\s+([A-Za-z0-9_<>,\s]+)\s+([A-Za-z0-9_]+);
    
    fields = []
    
    def repl(m):
        type_name = m.group(1).strip()
        var_name = m.group(2).strip()
        fields.append((type_name, var_name))
        return f"private final {type_name} {var_name};"
        
    content = re.sub(r'@Autowired\s*private\s+([A-Za-z0-9_<>,\s]+)\s+([A-Za-z0-9_]+);', repl, content)
    
    if not fields:
        continue
        
    # Get class name
    class_match = re.search(r'(?:public\s+)?class\s+([A-Za-z0-9_]+)', content)
    if not class_match:
        continue
    class_name = class_match.group(1)
    
    # Check if there is already a constructor with that class name
    if re.search(rf'public\s+{class_name}\s*\(', content):
        # Already has a constructor, skip or we'll mess it up
        print(f"Skipping {class_name} because it already has a constructor.")
        continue
        
    # Build constructor string
    args = ", ".join([f"{t} {n}" for t, n in fields])
    assignments = "\n".join([f"        this.{n} = {n};" for t, n in fields])
    
    constructor_code = f"\n    public {class_name}({args}) {{\n{assignments}\n    }}\n"
    
    # Insert constructor after the first '{' of the class
    class_def_pattern = rf'(class\s+{class_name}[^{{]*{{)'
    
    def insert_constr(m):
        return m.group(1) + "\n" + constructor_code
        
    content = re.sub(class_def_pattern, insert_constr, content, count=1)
    
    # Remove import org.springframework.beans.factory.annotation.Autowired; if it exists
    content = content.replace("import org.springframework.beans.factory.annotation.Autowired;\n", "")
    content = content.replace("import org.springframework.beans.factory.annotation.Autowired;\r\n", "")
    
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content)
        
print("Done phase 2")
