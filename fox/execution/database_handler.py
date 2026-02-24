import os
import json
import datetime
from dotenv import load_dotenv

load_dotenv()

class DatabaseHandler:
    def __init__(self):
        self.db_path = os.path.join(os.path.dirname(__file__), '..', 'fox_db.json')
        if not os.path.exists(self.db_path):
            with open(self.db_path, 'w', encoding='utf-8') as f:
                json.dump([], f)

    def _read_db(self):
        try:
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return []

    def _write_db(self, data):
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def save_lead(self, phone, name, demand, status="Interessado", service="Imobiliária"):
        """
        Saves or updates a lead in a local JSON file.
        """
        db = self._read_db()
        
        # Check if lead already exists
        found = False
        for lead in db:
            if lead["phone"] == phone:
                lead["name"] = name
                lead["demand"] = demand
                lead["status"] = status
                lead["service"] = service
                lead["updated_at"] = datetime.datetime.now().isoformat()
                found = True
                break
        
        if not found:
            new_lead = {
                "id": len(db) + 1,
                "phone": phone,
                "name": name,
                "demand": demand,
                "status": status,
                "service": service,
                "created_at": datetime.datetime.now().isoformat(),
                "updated_at": datetime.datetime.now().isoformat()
            }
            db.append(new_lead)
        
        self._write_db(db)
        return True

    def get_metrics(self):
        """
        Retrieves leads for the dashboard from local file.
        """
        return self._read_db()

if __name__ == "__main__":
    db = DatabaseHandler()
    db.save_lead("+5511999999999", "Teste Local", "Interesse em aluguel")
    print("Lead salvo localmente em fox_db.json")
