sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function (Controller, MessageToast, MessageBox, JSONModel) {
    "use strict";

    return Controller.extend("burnoutui.controller.Dashboard", {

        onInit: function () {
            this._initializeDashboardModel();
            this._loadInitialData();
        },

        _initializeDashboardModel: function () {
            var oDashboardModel = new JSONModel({
                totalEmployees: 0,
                highRiskCount: 0,
                mediumRiskCount: 0,
                lowRiskCount: 0,
                departmentRisks: [],
                recentAnalysis: null,
                knowledgeBaseStats: {
                    totalDocuments: 0,
                    categories: {}
                },
                isAnalyzing: false,
                lastUpdated: null
            });
            
            this.getView().setModel(oDashboardModel, "dashboard");
        },

        _loadInitialData: function () {
            // Load employees
            this._loadEmployees();
            
            // Load burnout metrics
            this._loadBurnoutMetrics();
            
            // Load knowledge base stats
            this._loadKnowledgeBaseStats();
        },

        _loadEmployees: function () {
            var oModel = this.getView().getModel();
            var oDashboardModel = this.getView().getModel("dashboard");
            
            if (!oModel) {
                console.warn("OData model not available, using demo data");
                this._loadMockData();
                return;
            }
            
            var oBinding = oModel.bindList("/Employees");
            oBinding.requestContexts().then(function (aContexts) {
                var aEmployees = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });
                
                oDashboardModel.setProperty("/totalEmployees", aEmployees.length);
                this._calculateDepartmentStats(aEmployees);
            }.bind(this)).catch(function (oError) {
                console.warn("Error loading employees, using demo data:", oError.message);
                MessageToast.show("Using demo data - service connection needed");
                this._loadMockData();
            }.bind(this));
        },

        _loadMockData: function () {
            var oDashboardModel = this.getView().getModel("dashboard");
            
            // Set mock data
            oDashboardModel.setProperty("/totalEmployees", 25);
            oDashboardModel.setProperty("/highRiskCount", 3);
            oDashboardModel.setProperty("/mediumRiskCount", 7);
            oDashboardModel.setProperty("/lowRiskCount", 15);
            oDashboardModel.setProperty("/lastUpdated", new Date().toLocaleString());
            oDashboardModel.setProperty("/knowledgeBaseStats", {
                totalDocuments: 3,
                categories: {
                    'best-practices': 1,
                    'case-studies': 1,
                    'health-guidelines': 1
                }
            });
            
            // Mock department data
            var aDepartmentRisks = [
                { department: "Engineering", total: 8, high: 2, medium: 3, low: 3, riskPercentage: 62 },
                { department: "Sales", total: 6, high: 1, medium: 2, low: 3, riskPercentage: 50 },
                { department: "Finance", total: 5, high: 0, medium: 1, low: 4, riskPercentage: 20 },
                { department: "HR", total: 3, high: 0, medium: 1, low: 2, riskPercentage: 33 },
                { department: "Marketing", total: 3, high: 0, medium: 0, low: 3, riskPercentage: 0 }
            ];
            oDashboardModel.setProperty("/departmentRisks", aDepartmentRisks);
        },

        _loadBurnoutMetrics: function () {
            var oModel = this.getView().getModel();
            var oDashboardModel = this.getView().getModel("dashboard");
            
            if (!oModel) {
                return;
            }
            
            var oBinding = oModel.bindList("/BurnoutMetrics");
            oBinding.requestContexts().then(function (aContexts) {
                var aBurnoutMetrics = aContexts.map(function (oContext) {
                    return oContext.getObject();
                });
                
                this._calculateRiskDistribution(aBurnoutMetrics);
            }.bind(this)).catch(function (oError) {
                console.warn("Error loading burnout metrics:", oError.message);
            });
        },

        _calculateRiskDistribution: function (aBurnoutMetrics) {
            var oDashboardModel = this.getView().getModel("dashboard");
            
            var iHighRisk = aBurnoutMetrics.filter(function (oMetric) {
                return oMetric.risk_level === "High";
            }).length;
            
            var iMediumRisk = aBurnoutMetrics.filter(function (oMetric) {
                return oMetric.risk_level === "Medium";
            }).length;
            
            var iLowRisk = aBurnoutMetrics.filter(function (oMetric) {
                return oMetric.risk_level === "Low";
            }).length;
            
            oDashboardModel.setProperty("/highRiskCount", iHighRisk);
            oDashboardModel.setProperty("/mediumRiskCount", iMediumRisk);
            oDashboardModel.setProperty("/lowRiskCount", iLowRisk);
            oDashboardModel.setProperty("/lastUpdated", new Date().toLocaleString());
        },

        _calculateDepartmentStats: function (aEmployees) {
            var oDashboardModel = this.getView().getModel("dashboard");
            var oDepartmentStats = {};
            
            // Group by department
            aEmployees.forEach(function (oEmployee) {
                var sDept = oEmployee.department;
                if (!oDepartmentStats[sDept]) {
                    oDepartmentStats[sDept] = {
                        department: sDept,
                        total: 0,
                        high: 0,
                        medium: 0,
                        low: 0
                    };
                }
                oDepartmentStats[sDept].total++;
            });
            
            // Convert to array
            var aDepartmentRisks = Object.keys(oDepartmentStats).map(function (sKey) {
                var oStats = oDepartmentStats[sKey];
                oStats.riskPercentage = Math.round(((oStats.high + oStats.medium) / oStats.total) * 100);
                return oStats;
            });
            
            oDashboardModel.setProperty("/departmentRisks", aDepartmentRisks);
        },

        _loadKnowledgeBaseStats: function () {
            var oModel = this.getView().getModel();
            var oDashboardModel = this.getView().getModel("dashboard");
            
            if (!oModel) {
                return;
            }
            
            // Call knowledge base stats action
            var oAction = oModel.bindContext("/getKnowledgeBaseStats(...)");
            oAction.execute().then(function () {
                var oResult = oAction.getBoundContext().getObject();
                oDashboardModel.setProperty("/knowledgeBaseStats", oResult);
            }).catch(function (oError) {
                console.warn("Error loading knowledge base stats:", oError.message);
            });
        },

        formatPercentage: function (iValue, iTotal) {
            if (!iTotal || iTotal === 0) return "0%";
            return Math.round((iValue / iTotal) * 100) + "%";
        },

        onRunAnalysis: function () {
            var oDashboardModel = this.getView().getModel("dashboard");
            var oModel = this.getView().getModel();
            
            oDashboardModel.setProperty("/isAnalyzing", true);
            MessageToast.show("Starting RAG-enhanced burnout analysis...");
            
            if (!oModel) {
                // Demo mode
                setTimeout(function() {
                    oDashboardModel.setProperty("/isAnalyzing", false);
                    oDashboardModel.setProperty("/recentAnalysis", {
                        message: "Demo analysis completed successfully",
                        processedEmployees: 25,
                        timestamp: new Date().toISOString()
                    });
                    MessageBox.success("Demo analysis completed successfully!\n\nProcessed: 25 employees\nHigh Risk: 3\nMedium Risk: 7\nLow Risk: 15");
                }, 2000);
                return;
            }
            
            // Call calculateBurnoutRisk action
            var oAction = oModel.bindContext("/calculateBurnoutRisk(...)");
            oAction.execute().then(function () {
                var oResult = oAction.getBoundContext().getObject();
                
                oDashboardModel.setProperty("/recentAnalysis", oResult);
                oDashboardModel.setProperty("/isAnalyzing", false);
                
                MessageBox.success(
                    "Analysis completed successfully!\n\n" +
                    "Processed: " + oResult.processedEmployees + " employees\n" +
                    "High Risk: " + oResult.riskSummary.high + "\n" +
                    "Medium Risk: " + oResult.riskSummary.medium + "\n" +
                    "Low Risk: " + oResult.riskSummary.low,
                    {
                        title: "RAG Analysis Complete"
                    }
                );
                
                // Reload data to reflect changes
                this._loadBurnoutMetrics();
                
            }.bind(this)).catch(function (oError) {
                oDashboardModel.setProperty("/isAnalyzing", false);
                MessageBox.error("Analysis failed: " + oError.message);
            });
        },

        onViewEmployees: function () {
            MessageToast.show("Opening Employee List...");

            // Navigate to employee list view
            this._showEmployeeListDialog();
        },

        _showEmployeeListDialog: function () {
            var oView = this.getView();

            // Create dialog if it doesn't exist
            if (!this._oEmployeeDialog) {
                this._oEmployeeDialog = sap.ui.xmlfragment(oView.getId(), "burnoutui.fragment.EmployeeListDialog", this);
                oView.addDependent(this._oEmployeeDialog);

                // Initialize employee dialog model
                this._initializeEmployeeDialogModel();
            }

            // Load employee data
            this._loadEmployeeDialogData();
            this._oEmployeeDialog.open();
        },

        _initializeEmployeeDialogModel: function () {
            var oEmployeeDialogModel = new JSONModel({
                allEmployees: [],
                filteredEmployees: [],
                selectedEmployees: [],
                selectedDepartment: "",
                selectedRiskLevel: "",
                searchQuery: ""
            });

            this.getView().setModel(oEmployeeDialogModel, "employeeDialog");
        },

        _loadEmployeeDialogData: function () {
            var oEmployeeDialogModel = this.getView().getModel("employeeDialog");

            // Mock employee data with detailed information
            var aMockEmployees = [
                {
                    id: "EMP001",
                    name: "John Smith",
                    email: "john.smith@company.com",
                    department: "Engineering",
                    role: "Senior Software Developer",
                    manager: "Sarah Wilson",
                    riskLevel: "High",
                    workingHours: "55",
                    overtime: "15",
                    productivityScore: 85,
                    stressLevel: 78,
                    engagementScore: 65,
                    workloadIndex: 92,
                    leaveTaken: "5",
                    lastCheckin: "2024-01-15",
                    joinDate: "2020-03-15",
                    recommendations: []
                },
                {
                    id: "EMP002",
                    name: "Sarah Johnson",
                    email: "sarah.johnson@company.com",
                    department: "Sales",
                    role: "Sales Manager",
                    manager: "Mike Davis",
                    riskLevel: "Medium",
                    workingHours: "45",
                    overtime: "5",
                    productivityScore: 78,
                    stressLevel: 55,
                    engagementScore: 82,
                    workloadIndex: 68,
                    leaveTaken: "12",
                    lastCheckin: "2024-01-18",
                    joinDate: "2019-07-22",
                    recommendations: []
                },
                {
                    id: "EMP003",
                    name: "Mike Davis",
                    email: "mike.davis@company.com",
                    department: "Finance",
                    role: "Financial Analyst",
                    manager: "Lisa Anderson",
                    riskLevel: "Low",
                    workingHours: "40",
                    overtime: "2",
                    productivityScore: 88,
                    stressLevel: 35,
                    engagementScore: 90,
                    workloadIndex: 45,
                    leaveTaken: "18",
                    lastCheckin: "2024-01-20",
                    joinDate: "2021-01-10",
                    recommendations: []
                },
                {
                    id: "EMP004",
                    name: "Emily Brown",
                    email: "emily.brown@company.com",
                    department: "HR",
                    role: "HR Specialist",
                    manager: "David Wilson",
                    riskLevel: "Low",
                    workingHours: "38",
                    overtime: "1",
                    productivityScore: 82,
                    stressLevel: 28,
                    engagementScore: 88,
                    workloadIndex: 42,
                    leaveTaken: "15",
                    lastCheckin: "2024-01-19",
                    joinDate: "2020-09-05",
                    recommendations: []
                },
                {
                    id: "EMP005",
                    name: "David Wilson",
                    email: "david.wilson@company.com",
                    department: "Engineering",
                    role: "DevOps Engineer",
                    manager: "Sarah Wilson",
                    riskLevel: "High",
                    workingHours: "52",
                    overtime: "12",
                    productivityScore: 90,
                    stressLevel: 72,
                    engagementScore: 70,
                    workloadIndex: 88,
                    leaveTaken: "8",
                    lastCheckin: "2024-01-17",
                    joinDate: "2019-11-12",
                    recommendations: []
                },
                {
                    id: "EMP006",
                    name: "Lisa Anderson",
                    email: "lisa.anderson@company.com",
                    department: "Marketing",
                    role: "Marketing Manager",
                    manager: "John Roberts",
                    riskLevel: "Medium",
                    workingHours: "42",
                    overtime: "4",
                    productivityScore: 75,
                    stressLevel: 48,
                    engagementScore: 85,
                    workloadIndex: 58,
                    leaveTaken: "20",
                    lastCheckin: "2024-01-16",
                    joinDate: "2018-05-20",
                    recommendations: []
                }
            ];

            oEmployeeDialogModel.setProperty("/allEmployees", aMockEmployees);
            oEmployeeDialogModel.setProperty("/filteredEmployees", aMockEmployees);
        },

        onCloseEmployeeDialog: function () {
            if (this._oEmployeeDialog) {
                this._oEmployeeDialog.close();
            }
        },

        onViewKnowledgeBase: function () {
            MessageToast.show("Knowledge base view - Coming soon!");
        },

        onViewAnalytics: function () {
            MessageToast.show("Analytics view - Coming soon!");
        },

        // Employee Dialog Methods
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

        onEmployeeSearch: function (oEvent) {
            var sQuery = oEvent.getParameter("newValue") || oEvent.getParameter("query") || "";
            var oEmployeeDialogModel = this.getView().getModel("employeeDialog");
            oEmployeeDialogModel.setProperty("/searchQuery", sQuery);
            this._applyEmployeeFilters();
        },

        onFilterChange: function () {
            this._applyEmployeeFilters();
        },

        _applyEmployeeFilters: function () {
            var oEmployeeDialogModel = this.getView().getModel("employeeDialog");
            var aAllEmployees = oEmployeeDialogModel.getProperty("/allEmployees");
            var sDepartment = oEmployeeDialogModel.getProperty("/selectedDepartment");
            var sRiskLevel = oEmployeeDialogModel.getProperty("/selectedRiskLevel");
            var sSearchQuery = oEmployeeDialogModel.getProperty("/searchQuery");

            var aFilteredEmployees = aAllEmployees.filter(function (oEmployee) {
                var bDepartmentMatch = !sDepartment || oEmployee.department === sDepartment;
                var bRiskMatch = !sRiskLevel || oEmployee.riskLevel === sRiskLevel;
                var bSearchMatch = !sSearchQuery ||
                    oEmployee.name.toLowerCase().includes(sSearchQuery.toLowerCase()) ||
                    oEmployee.email.toLowerCase().includes(sSearchQuery.toLowerCase()) ||
                    oEmployee.department.toLowerCase().includes(sSearchQuery.toLowerCase()) ||
                    oEmployee.role.toLowerCase().includes(sSearchQuery.toLowerCase());

                return bDepartmentMatch && bRiskMatch && bSearchMatch;
            });

            oEmployeeDialogModel.setProperty("/filteredEmployees", aFilteredEmployees);
        },

        onClearEmployeeFilters: function () {
            var oEmployeeDialogModel = this.getView().getModel("employeeDialog");
            oEmployeeDialogModel.setProperty("/selectedDepartment", "");
            oEmployeeDialogModel.setProperty("/selectedRiskLevel", "");
            oEmployeeDialogModel.setProperty("/searchQuery", "");

            // Clear search field
            var oSearchField = sap.ui.getCore().byId(this.getView().getId() + "--employeeSearchField");
            if (oSearchField) {
                oSearchField.setValue("");
            }

            this._applyEmployeeFilters();
            MessageToast.show("Filters cleared");
        },

        onRefreshEmployees: function () {
            MessageToast.show("Refreshing employee data...");
            this._loadEmployeeDialogData();
        },

        onEmployeeSelectionChange: function (oEvent) {
            var oTable = oEvent.getSource();
            var aSelectedItems = oTable.getSelectedItems();
            var aSelectedEmployees = aSelectedItems.map(function (oItem) {
                return oItem.getBindingContext("employeeDialog").getObject();
            });

            var oEmployeeDialogModel = this.getView().getModel("employeeDialog");
            oEmployeeDialogModel.setProperty("/selectedEmployees", aSelectedEmployees);
        },

        onEmployeeItemPress: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("employeeDialog");
            var oEmployee = oContext.getObject();
            this._showEmployeeDetailsDialog(oEmployee);
        },

        onViewEmployeeDetails: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("employeeDialog");
            var oEmployee = oContext.getObject();
            this._showEmployeeDetailsDialog(oEmployee);
        },

        _showEmployeeDetailsDialog: function (oEmployee) {
            var oView = this.getView();

            // Create employee details dialog if it doesn't exist
            if (!this._oEmployeeDetailsDialog) {
                this._oEmployeeDetailsDialog = sap.ui.xmlfragment(oView.getId(), "burnoutui.fragment.EmployeeDetailsDialog", this);
                oView.addDependent(this._oEmployeeDetailsDialog);

                // Initialize employee details model
                var oEmployeeDetailsModel = new JSONModel({
                    selectedEmployee: null
                });
                oView.setModel(oEmployeeDetailsModel, "employeeDetails");
            }

            // Set selected employee
            var oEmployeeDetailsModel = this.getView().getModel("employeeDetails");
            oEmployeeDetailsModel.setProperty("/selectedEmployee", oEmployee);

            this._oEmployeeDetailsDialog.open();
        },

        onCloseEmployeeDetails: function () {
            if (this._oEmployeeDetailsDialog) {
                this._oEmployeeDetailsDialog.close();
            }
        },

        onGenerateEmployeeRecommendations: function (oEvent) {
            var oContext = oEvent.getSource().getBindingContext("employeeDialog");
            var oEmployee = oContext.getObject();

            MessageToast.show("Generating AI recommendations for " + oEmployee.name + "...");

            // Simulate RAG recommendation generation
            setTimeout(function() {
                var aRecommendations = this._generateMockRecommendations(oEmployee);

                MessageBox.information(
                    "AI-Generated Recommendations for " + oEmployee.name + ":\n\n" +
                    aRecommendations.map(function(rec, index) {
                        return (index + 1) + ". " + rec.text;
                    }).join("\n"),
                    {
                        title: "RAG-Enhanced Recommendations"
                    }
                );
            }.bind(this), 1500);
        },

        _generateMockRecommendations: function (oEmployee) {
            var aRecommendations = [];

            if (oEmployee.riskLevel === "High") {
                aRecommendations.push(
                    { text: "Immediate workload reduction recommended - consider redistributing 20% of current tasks" },
                    { text: "Schedule mandatory wellness check-in within 48 hours" },
                    { text: "Implement flexible working hours to reduce stress" },
                    { text: "Provide access to mental health resources and counseling" }
                );
            } else if (oEmployee.riskLevel === "Medium") {
                aRecommendations.push(
                    { text: "Monitor workload closely and prevent overtime exceeding 10 hours/week" },
                    { text: "Schedule bi-weekly check-ins with manager" },
                    { text: "Encourage use of available vacation days" },
                    { text: "Provide stress management training" }
                );
            } else {
                aRecommendations.push(
                    { text: "Maintain current work-life balance practices" },
                    { text: "Consider for mentoring opportunities with high-risk colleagues" },
                    { text: "Regular monthly wellness check-ins" }
                );
            }

            return aRecommendations;
        },

        onGenerateBulkRecommendations: function () {
            var oEmployeeDialogModel = this.getView().getModel("employeeDialog");
            var aSelectedEmployees = oEmployeeDialogModel.getProperty("/selectedEmployees");

            if (aSelectedEmployees.length === 0) {
                MessageToast.show("Please select employees first");
                return;
            }

            MessageToast.show("Generating bulk recommendations for " + aSelectedEmployees.length + " employees...");

            setTimeout(function() {
                MessageBox.success(
                    "Bulk recommendations generated successfully!\n\n" +
                    "Processed: " + aSelectedEmployees.length + " employees\n" +
                    "High priority actions: " + aSelectedEmployees.filter(emp => emp.riskLevel === "High").length + "\n" +
                    "Medium priority actions: " + aSelectedEmployees.filter(emp => emp.riskLevel === "Medium").length + "\n" +
                    "Recommendations have been saved to employee profiles.",
                    {
                        title: "Bulk RAG Analysis Complete"
                    }
                );
            }, 2000);
        },

        onExportEmployees: function () {
            MessageToast.show("Exporting employee data to Excel...");
            // In a real implementation, this would generate and download an Excel file
        },

        // Employee Details Dialog Methods
        onGenerateNewRecommendations: function () {
            var oEmployeeDetailsModel = this.getView().getModel("employeeDetails");
            var oEmployee = oEmployeeDetailsModel.getProperty("/selectedEmployee");

            MessageToast.show("Generating new AI recommendations for " + oEmployee.name + "...");

            setTimeout(function() {
                var aNewRecommendations = this._generateMockRecommendations(oEmployee);
                oEmployeeDetailsModel.setProperty("/selectedEmployee/recommendations", aNewRecommendations);
                MessageToast.show("New recommendations generated successfully!");
            }.bind(this), 2000);
        },

        onScheduleCheckin: function () {
            var oEmployeeDetailsModel = this.getView().getModel("employeeDetails");
            var oEmployee = oEmployeeDetailsModel.getProperty("/selectedEmployee");

            MessageBox.confirm(
                "Schedule a wellness check-in for " + oEmployee.name + "?",
                {
                    title: "Schedule Check-in",
                    onClose: function(sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            MessageToast.show("Check-in scheduled for " + oEmployee.name);
                        }
                    }
                }
            );
        },

        onSendRecommendations: function () {
            var oEmployeeDetailsModel = this.getView().getModel("employeeDetails");
            var oEmployee = oEmployeeDetailsModel.getProperty("/selectedEmployee");

            MessageBox.confirm(
                "Send AI-generated recommendations to " + oEmployee.name + " via email?",
                {
                    title: "Send Recommendations",
                    onClose: function(sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            MessageToast.show("Recommendations sent to " + oEmployee.email);
                        }
                    }
                }
            );
        },

        onExportEmployeeReport: function () {
            var oEmployeeDetailsModel = this.getView().getModel("employeeDetails");
            var oEmployee = oEmployeeDetailsModel.getProperty("/selectedEmployee");

            MessageToast.show("Exporting detailed report for " + oEmployee.name + "...");
            // In a real implementation, this would generate a comprehensive PDF report
        }
    });
});
