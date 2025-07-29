sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], (Controller, MessageToast) => {
    "use strict";

    return Controller.extend("burnoutui.controller.Glass", {
        onInit() {
            // Initialize the main view
        },

        onOpenDashboard() {
            MessageToast.show("Scrolling to dashboard...");

            // Scroll to dashboard with better positioning
            var oDashboardView = this.byId("dashboardView");
            if (oDashboardView && oDashboardView.getDomRef()) {
                oDashboardView.getDomRef().scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                    inline: 'nearest'
                });
            } else {
                // Fallback: scroll to bottom of page
                setTimeout(function() {
                    window.scrollTo({
                        top: document.body.scrollHeight,
                        behavior: 'smooth'
                    });
                }, 100);
            }
        }
    });
});