import requests
import sys
import json
from datetime import datetime, timedelta

class AbsenceManagementTester:
    def __init__(self, base_url="https://time-off-planner-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_token = None
        self.employee_token = None
        self.hr_token = None
        self.manager_token = None
        self.test_user_id = None
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
        timestamp = datetime.now().strftime("%H%M%S")
        success, response = self.run_test(
            "Employee Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"test.employee.{timestamp}@test.it",
                "password": "employee123",
                "first_name": "Mario",
                "last_name": "Rossi",
                "role": "employee",
                "total_ferie_hours": 160,
                "total_permessi_hours": 80,
                "monthly_ferie_hours": 14,
                "monthly_permessi_hours": 8
            }
        )
        if success and 'token' in response:
            self.employee_token = response['token']
            self.test_user_id = response['user']['user_id']
            print(f"   Employee token obtained: {self.employee_token[:20]}...")
            print(f"   Employee user_id: {self.test_user_id}")
            return True
        return False

    def test_hr_registration(self):
        """Test HR (ufficio_personale) registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        success, response = self.run_test(
            "HR Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"hr.{timestamp}@test.it",
                "password": "hr123",
                "first_name": "Anna",
                "last_name": "Bianchi",
                "role": "ufficio_personale",
                "total_ferie_hours": 160,
                "total_permessi_hours": 80
            }
        )
        if success and 'token' in response:
            self.hr_token = response['token']
            print(f"   HR token obtained: {self.hr_token[:20]}...")
            return True
        return False

    def test_manager_registration(self):
        """Test Manager registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        success, response = self.run_test(
            "Manager Registration",
            "POST",
            "auth/register",
            200,
            data={
                "email": f"manager.{timestamp}@test.it",
                "password": "manager123",
                "first_name": "Luca",
                "last_name": "Verdi",
                "role": "manager",
                "total_ferie_hours": 160,
                "total_permessi_hours": 80
            }
        )
        if success and 'token' in response:
            self.manager_token = response['token']
            print(f"   Manager token obtained: {self.manager_token[:20]}...")
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

    # NEW FEATURES TESTS
    
    def test_get_my_balance(self):
        """Test get current user's hours balance"""
        return self.run_test(
            "Get My Balance",
            "GET",
            "balance/my",
            200,
            token=self.employee_token
        )

    def test_get_all_balances(self):
        """Test get all users' hours balance (admin/manager/hr only)"""
        return self.run_test(
            "Get All Balances",
            "GET",
            "balance/all",
            200,
            token=self.admin_token
        )

    def test_hr_access_to_balances(self):
        """Test HR can access all balances"""
        return self.run_test(
            "HR Access to All Balances",
            "GET",
            "balance/all",
            200,
            token=self.hr_token
        )

    def test_create_permesso_with_hours(self):
        """Test creating permesso request with mandatory hours"""
        tomorrow = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        
        success, response = self.run_test(
            "Create Permesso with Hours",
            "POST",
            "absences",
            200,
            data={
                "absence_type": "permesso",
                "start_date": tomorrow,
                "end_date": tomorrow,
                "hours": 4.0,
                "notes": "Test permesso with hours"
            },
            token=self.employee_token
        )
        if success and 'absence_id' in response:
            self.test_permesso_id = response['absence_id']
            return True
        return False

    def test_create_permesso_without_hours(self):
        """Test creating permesso request without hours (should fail)"""
        tomorrow = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
        
        success, _ = self.run_test(
            "Create Permesso without Hours (should fail)",
            "POST",
            "absences",
            400,  # Should fail with 400
            data={
                "absence_type": "permesso",
                "start_date": tomorrow,
                "end_date": tomorrow,
                "notes": "Test permesso without hours"
            },
            token=self.employee_token
        )
        return success

    def test_add_hours_to_user(self):
        """Test adding hours to a user (admin/manager/hr can do this)"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        return self.run_test(
            "Add Hours to User",
            "POST",
            f"users/{self.test_user_id}/add-hours",
            200,
            data={
                "user_id": self.test_user_id,
                "hours_type": "ferie",
                "hours": 8.0,
                "notes": "Test bonus hours"
            },
            token=self.admin_token
        )

    def test_hr_add_hours_to_user(self):
        """Test HR can add hours to users"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        return self.run_test(
            "HR Add Hours to User",
            "POST",
            f"users/{self.test_user_id}/add-hours",
            200,
            data={
                "user_id": self.test_user_id,
                "hours_type": "permessi",
                "hours": 4.0,
                "notes": "HR adjustment"
            },
            token=self.hr_token
        )

    def test_monthly_accrual(self):
        """Test monthly accrual functionality"""
        return self.run_test(
            "Monthly Accrual",
            "POST",
            "hours/monthly-accrual",
            200,
            token=self.admin_token
        )

    def test_hr_monthly_accrual(self):
        """Test HR can run monthly accrual"""
        return self.run_test(
            "HR Monthly Accrual",
            "POST",
            "hours/monthly-accrual",
            200,
            token=self.hr_token
        )

    def test_update_user_hours(self):
        """Test updating user with hours management"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        return self.run_test(
            "Update User Hours",
            "PUT",
            f"users/{self.test_user_id}",
            200,
            data={
                "total_ferie_hours": 200.0,
                "total_permessi_hours": 100.0,
                "monthly_ferie_hours": 16.0,
                "monthly_permessi_hours": 10.0
            },
            token=self.admin_token
        )

    def test_hr_access_to_users(self):
        """Test HR can access users endpoint"""
        return self.run_test(
            "HR Access to Users",
            "GET",
            "users",
            200,
            token=self.hr_token
        )

    def test_hr_access_to_pending_absences(self):
        """Test HR can access pending absences for approval"""
        return self.run_test(
            "HR Access to Pending Absences",
            "GET",
            "absences/pending",
            200,
            token=self.hr_token
        )

    def test_get_absences_with_filters(self):
        """Test get absences with type filters"""
        # Test filter by ferie
        success1, _ = self.run_test(
            "Get Absences - Filter by Ferie",
            "GET",
            "absences?absence_type=ferie",
            200,
            token=self.admin_token
        )
        
        # Test filter by permesso
        success2, _ = self.run_test(
            "Get Absences - Filter by Permesso",
            "GET",
            "absences?absence_type=permesso",
            200,
            token=self.admin_token
        )
        
        # Test filter by status
        success3, _ = self.run_test(
            "Get Absences - Filter by Status",
            "GET",
            "absences?status=approved",
            200,
            token=self.admin_token
        )
        
        return success1 and success2 and success3

def main():
    print("🚀 Starting Absence Management API Tests - New Features")
    print("=" * 60)
    
    tester = AbsenceManagementTester()
    
    # Test sequence - including new features
    tests = [
        ("Health Check", tester.test_health_check),
        ("Admin Login", tester.test_admin_login),
        ("Employee Registration", tester.test_employee_registration),
        ("HR Registration", tester.test_hr_registration),
        ("Manager Registration", tester.test_manager_registration),
        ("Get Current User", tester.test_get_current_user),
        ("Get Users", tester.test_get_users),
        ("HR Access to Users", tester.test_hr_access_to_users),
        ("Get Stats", tester.test_get_stats),
        
        # Hours Balance Tests (NEW)
        ("Get My Balance", tester.test_get_my_balance),
        ("Get All Balances", tester.test_get_all_balances),
        ("HR Access to All Balances", tester.test_hr_access_to_balances),
        
        # Absence Tests with Hours (NEW)
        ("Create Absence Request", tester.test_create_absence_request),
        ("Create Permesso with Hours", tester.test_create_permesso_with_hours),
        ("Create Permesso without Hours (should fail)", tester.test_create_permesso_without_hours),
        ("Get Absences with Filters", tester.test_get_absences_with_filters),
        ("Get All Absences", tester.test_get_all_absences),
        ("Get My Absences", tester.test_get_my_absences),
        ("Get Pending Absences", tester.test_get_pending_absences),
        ("HR Access to Pending Absences", tester.test_hr_access_to_pending_absences),
        ("Approve Absence", tester.test_approve_absence),
        
        # Hours Management Tests (NEW)
        ("Add Hours to User", tester.test_add_hours_to_user),
        ("HR Add Hours to User", tester.test_hr_add_hours_to_user),
        ("Update User Hours", tester.test_update_user_hours),
        ("Monthly Accrual", tester.test_monthly_accrual),
        ("HR Monthly Accrual", tester.test_hr_monthly_accrual),
        
        # Settings Tests
        ("Get Settings", tester.test_get_settings),
        ("Update Settings", tester.test_update_settings),
        
        # Security Tests
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
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.failed_tests:
        print("\n❌ Failed Tests:")
        for failure in tester.failed_tests:
            error_msg = failure.get('error', f"Expected {failure.get('expected')}, got {failure.get('actual')}")
            print(f"   - {failure['test']}: {error_msg}")
    
    success_rate = (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())