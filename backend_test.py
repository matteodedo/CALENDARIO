import requests
import sys
import json
from datetime import datetime, timedelta

class AbsenceManagementTester:
    def __init__(self, base_url="https://time-off-planner-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.employee_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, token=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Response: {response.text}")
                self.failed_tests.append({
                    "test": name,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "endpoint": endpoint
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                "test": name,
                "error": str(e),
                "endpoint": endpoint
            })
            return False, {}

    def test_health_check(self):
        """Test API health check"""
        return self.run_test("Health Check", "GET", "", 200)

    def test_admin_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@test.it", "password": "admin123"}
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin token obtained: {self.admin_token[:20]}...")
            return True
        return False

    def test_employee_registration(self):
        """Test employee registration"""
        success, response = self.run_test(
            "Employee Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": "test.employee@test.it",
                "password": "employee123",
                "first_name": "Mario",
                "last_name": "Rossi",
                "role": "employee"
            }
        )
        if success and 'token' in response:
            self.employee_token = response['token']
            print(f"   Employee token obtained: {self.employee_token[:20]}...")
            return True
        return False

    def test_get_current_user(self):
        """Test get current user info"""
        return self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200,
            token=self.admin_token
        )

    def test_get_users(self):
        """Test get all users"""
        return self.run_test(
            "Get Users",
            "GET",
            "users",
            200,
            token=self.admin_token
        )

    def test_get_stats(self):
        """Test get statistics"""
        return self.run_test(
            "Get Stats",
            "GET",
            "stats",
            200,
            token=self.admin_token
        )

    def test_create_absence_request(self):
        """Test creating absence request"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        day_after = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        
        success, response = self.run_test(
            "Create Absence Request",
            "POST",
            "absences",
            200,
            data={
                "absence_type": "ferie",
                "start_date": tomorrow,
                "end_date": day_after,
                "notes": "Test vacation request"
            },
            token=self.employee_token
        )
        if success and 'absence_id' in response:
            self.test_absence_id = response['absence_id']
            return True
        return False

    def test_get_all_absences(self):
        """Test get all absences (calendar view)"""
        return self.run_test(
            "Get All Absences",
            "GET",
            "absences",
            200,
            token=self.admin_token
        )

    def test_get_my_absences(self):
        """Test get user's own absences"""
        return self.run_test(
            "Get My Absences",
            "GET",
            "absences/my",
            200,
            token=self.employee_token
        )

    def test_get_pending_absences(self):
        """Test get pending absences for approval"""
        return self.run_test(
            "Get Pending Absences",
            "GET",
            "absences/pending",
            200,
            token=self.admin_token
        )

    def test_approve_absence(self):
        """Test approving an absence request"""
        if hasattr(self, 'test_absence_id'):
            return self.run_test(
                "Approve Absence",
                "PUT",
                f"absences/{self.test_absence_id}/action",
                200,
                data={"action": "approve"},
                token=self.admin_token
            )
        else:
            print("❌ No absence ID available for approval test")
            return False

    def test_get_settings(self):
        """Test get company settings"""
        return self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200,
            token=self.admin_token
        )

    def test_update_settings(self):
        """Test update company settings"""
        return self.run_test(
            "Update Settings",
            "PUT",
            "settings",
            200,
            data={
                "company_name": "Test Company",
                "logo_base64": None
            },
            token=self.admin_token
        )

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        success, _ = self.run_test(
            "Unauthorized Access Test",
            "GET",
            "users",
            401
        )
        return success

    def test_employee_access_to_admin_endpoint(self):
        """Test employee trying to access admin-only endpoint"""
        success, _ = self.run_test(
            "Employee Access to Admin Endpoint",
            "GET",
            "users",
            403,
            token=self.employee_token
        )
        return success

def main():
    print("🚀 Starting Absence Management API Tests")
    print("=" * 50)
    
    tester = AbsenceManagementTester()
    
    # Test sequence
    tests = [
        ("Health Check", tester.test_health_check),
        ("Admin Login", tester.test_admin_login),
        ("Employee Registration", tester.test_employee_registration),
        ("Get Current User", tester.test_get_current_user),
        ("Get Users", tester.test_get_users),
        ("Get Stats", tester.test_get_stats),
        ("Create Absence Request", tester.test_create_absence_request),
        ("Get All Absences", tester.test_get_all_absences),
        ("Get My Absences", tester.test_get_my_absences),
        ("Get Pending Absences", tester.test_get_pending_absences),
        ("Approve Absence", tester.test_approve_absence),
        ("Get Settings", tester.test_get_settings),
        ("Update Settings", tester.test_update_settings),
        ("Unauthorized Access", tester.test_unauthorized_access),
        ("Employee Access to Admin", tester.test_employee_access_to_admin_endpoint),
    ]
    
    # Run all tests
    for test_name, test_func in tests:
        try:
            test_func()
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            tester.failed_tests.append({
                "test": test_name,
                "error": str(e)
            })
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            print(f"   - {failure['test']}: {failure.get('error', f\"Expected {failure.get('expected')}, got {failure.get('actual')}\"")}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())