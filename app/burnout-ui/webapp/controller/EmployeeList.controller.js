sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], function (Controller, MessageToast, MessageBox, JSONModel, Filter, FilterOperator) {
    "use strict";

    return Controller.extend("burnoutui.controller.EmployeeList", {

        onInit: function () {
            this._initializeEmployeeModel();
            this._loadEmployeeData();
        },

        _initializeEmployeeModel: function () {
            var oEmployeeModel = new JSONModel({
                employees: [],
                filteredEmployees: [],
                selectedEmployee: null,
                selectedDepartment: "",
                selectedRiskLevel: "",
                searchQuery: "",
                departments: [
                    { key: "", text: "All Departments" },
                    { key: "Engineering", text: "Engineering" },
                    { key: "Sales", text: "Sales" },
                    { key: "Finance", text: "Finance" },
                    { key: "HR", text: "HR" },
                    { key: "Marketing", text: "Marketing" }
                ],
                riskLevels: [
                    { key: "", text: "All Risk Levels" },
                    { key: "High", text: "High Risk" },
                    { key: "Medium", text: "Medium Risk" },
                    { key: "Low", text: "Low Risk" }
                ]
            });
            
            this.getView().setModel(oEmployeeModel, "employee");
        },

        _loadEmployeeData: function () {
            var oModel = this.getView().getModel();
            var oEmployeeModel = this.getView().getModel("employee");
            
            if (!oModel) {
                console.warn("OData model not available, using demo data");
                this._loadMockEmployeeData();
                return;
            }
            
            var oBinding = oModel.bindList("/Employees");
            oBinding.requestContexts().then(function (aContexts) {
                var aEmployees = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });
                
                oEmployeeModel.setProperty("/employees", aEmployees);
                oEmployeeModel.setProperty("/filteredEmployees", aEmployees);
                
            }.bind(this)).catch(function (oError) {
                console.warn("Error loading employees, using demo data:", oError.message);
                MessageToast.show("Using demo data - service connection needed");
                this._loadMockEmployeeData();
            }.bind(this));
        },

        _loadMockEmployeeData: function () {
            var oEmployeeModel = this.getView().getModel("employee");
            
            var aMockEmployees = [
                {
                    id: "1",
                    name: "John Smith",
                    email: "john.smith@company.com",
                    department: "Engineering",
                    role: "Senior Developer",
                    riskLevel: "High",
                    workingHours: "55",
                    overtime: "15"
                },
                {
                    id: "2",
                    name: "Sarah Johnson",
                    email: "sarah.johnson@company.com",
                    department: "Sales",
                    role: "Sales Manager",
                    riskLevel: "Medium",
                    workingHours: "45",
                    overtime: "5"
                },
                {
                    id: "3",
                    name: "Mike Davis",
                    email: "mike.davis@company.com",
                    department: "Finance",
                    role: "Financial Analyst",
                    riskLevel: "Low",
                    workingHours: "40",
                    overtime: "2"
                },
                {
                    id: "4",
                    name: "Emily Brown",
                    email: "emily.brown@company.com",
                    department: "HR",
                    role: "HR Specialist",
                    riskLevel: "Low",
                    workingHours: "38",
                    overtime: "1"
                },
                {
                    id: "5",
                    name: "David Wilson",
                    email: "david.wilson@company.com",
                    department: "Engineering",
                    role: "DevOps Engineer",
                    riskLevel: "High",
                    workingHours: "52",
                    overtime: "12"
                },
                {
                    id: "6",
                    name: "Lisa Anderson",
                    email: "lisa.anderson@company.com",
                    department: "Marketing",
                    role: "Marketing Manager",
                    riskLevel: "Medium",
                    workingHours: "42",
                    overtime: "4"
                }
            ];
            
            oEmployeeModel.setProperty("/employees", aMockEmployees);
            oEmployeeModel.setProperty("/filteredEmployees", aMockEmployees);
        },

        formatRiskState: function (sRiskLevel) {
            switch (sRiskLevel) {
                case "High":
                    return "Error";
                case "Medium":
                    return "Warning";
                case "Low":
                    return "Success";
                default:
                    return "None";
            }
        },

        onFilterChange: function () {
            this._applyFilters();
        },

        onSearch: function () {
            this._applyFilters();
        },

        _applyFilters: function () {
            var oEmployeeModel = this.getView().getModel("employee");
            var aEmployees = oEmployeeModel.getProperty("/employees");
            var sDepartment = oEmployeeModel.getProperty("/selectedDepartment");
            var sRiskLevel = oEmployeeModel.getProperty("/selectedRiskLevel");
            var sSearchQuery = oEmployeeModel.getProperty("/searchQuery");
            
            var aFilteredEmployees = aEmployees.filter(function (oEmployee) {
                var bDepartmentMatch = !sDepartment || oEmployee.department === sDepartment;
                var bRiskMatch = !sRiskLevel || oEmployee.riskLevel === sRiskLevel;
                var bSearchMatch = !sSearchQuery || 
                    oEmployee.name.toLowerCase().includes(sSearchQuery.toLowerCase()) ||
                    oEmployee.email.toLowerCase().includes(sSearchQuery.toLowerCase()) ||
                    oEmployee.role.toLowerCase().includes(sSearchQuery.toLowerCase());
                
                return bDepartmentMatch && bRiskMatch && bSearchMatch;
            });
            
            oEmployeeModel.setProperty("/filteredEmployees", aFilteredEmployees);
        },

        onClearFilters: function () {
            var oEmployeeModel = this.getView().getModel("employee");
            
            oEmployeeModel.setProperty("/selectedDepartment", "");
            oEmployeeModel.setProperty("/selectedRiskLevel", "");
            oEmployeeModel.setProperty("/searchQuery", "");
            
            this._applyFilters();
            
            MessageToast.show("Filters cleared");
        },

        onEmployeeSelect: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("listItem");
            var oContext = oSelectedItem.getBindingContext("employee");
            var oSelectedEmployee = oContext.getObject();
            
            var oEmployeeModel = this.getView().getModel("employee");
            oEmployeeModel.setProperty("/selectedEmployee", oSelectedEmployee);
            
            MessageToast.show("Selected: " + oSelectedEmployee.name);
        },

        onGenerateRecommendations: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("employee");
            var oEmployee = oContext.getObject();
            
            MessageToast.show("Generating recommendations for " + oEmployee.name + "...");
            
            // Simulate RAG recommendation generation
            setTimeout(function() {
                MessageBox.information(
                    "Recommendations generated for " + oEmployee.name + ":\n\n" +
                    "• Reduce overtime hours\n" +
                    "• Schedule regular breaks\n" +
                    "• Consider workload redistribution\n" +
                    "• Recommend wellness programs",
                    {
                        title: "AI-Generated Recommendations"
                    }
                );
            }, 1000);
        },

        onViewDetails: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("employee");
            var oEmployee = oContext.getObject();
            
            var oEmployeeModel = this.getView().getModel("employee");
            oEmployeeModel.setProperty("/selectedEmployee", oEmployee);
            
            // Scroll to details panel
            var oDetailsPanel = this.byId("employeeDetailsPanel");
            if (oDetailsPanel) {
                oDetailsPanel.getDomRef().scrollIntoView({ behavior: 'smooth' });
            }
        },

        onGenerateDetailedRecommendations: function () {
            var oEmployeeModel = this.getView().getModel("employee");
            var oSelectedEmployee = oEmployeeModel.getProperty("/selectedEmployee");
            
            if (!oSelectedEmployee) {
                MessageToast.show("No employee selected");
                return;
            }
            
            MessageToast.show("Generating detailed recommendations for " + oSelectedEmployee.name + "...");
            
            // Simulate detailed RAG analysis
            setTimeout(function() {
                MessageBox.information(
                    "Detailed RAG Analysis for " + oSelectedEmployee.name + ":\n\n" +
                    "Risk Level: " + oSelectedEmployee.riskLevel + "\n" +
                    "Working Hours: " + oSelectedEmployee.workingHours + "/week\n" +
                    "Overtime: " + oSelectedEmployee.overtime + " hours\n\n" +
                    "Immediate Actions:\n" +
                    "• Implement flexible working hours\n" +
                    "• Schedule mandatory breaks\n\n" +
                    "Long-term Strategies:\n" +
                    "• Workload assessment and redistribution\n" +
                    "• Stress management training\n" +
                    "• Regular wellness check-ins",
                    {
                        title: "Detailed AI Recommendations"
                    }
                );
            }, 2000);
        },

        onNavBack: function () {
            MessageToast.show("Navigating back to dashboard...");
            // In a real app, this would use the router to navigate back
        }
    });
});
