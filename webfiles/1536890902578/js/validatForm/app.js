/*
 * Validate form App
 */

(function () {
    var app = angular.module("validateFormApp", []);

    gdprCountries = [
        "Australia", "Austria", "Belgium", "Bulgaria", "Canada", "Croatia", "Cyprus",
    "Czech Republic", "Denmark", "Estonia", "Finland", "France", "Germany",
        "Greece", "Hungary", "Iceland", "Ireland", "Israel", "Italy", "Latvia", "Lithuania", "Liechtenstein", "Luxembourg", "Malta",
    "Netherlands", "New Zealand", "Norway", "Poland", "Portugal", "Romania", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland",
    "United Kingdom"];

    var changeCountry = function ($scope, $sce) {
        var tos = {
            name: '',
            gdpr: false
        };

        if ($scope.country == 'Germany') {
            tos.name = "Double_Opt_in_Compliant__c";
        } else if ($scope.country == 'Canada') {
            tos.name = "doubleOptinCompliantCanada";
        } else if ($scope.country == 'United States') {
            tos.name = "";
        } else{
            tos.name = "doubleOptinCompliantEnglish";
        }

        if($.inArray($scope.country, gdprCountries) > -1){
            tos.gdpr = true;
        }else{
            tos.gdpr = false;
        }

        $scope.tosGdpr = tos.gdpr;
        $scope.tosName = tos.name;
    };

    var validateEmail = function ($scope, emailElement) {
        var bvInvalidMsg = "Please enter a valid email address.";
        var ngValid = emailElement.hasClass("ng-valid");
        // only check if pattern passes
        if (ngValid) {
            var Email = emailElement.val();
            $.ajax({
                url: "https://api.grazitti.com/marketo/clients/couchbase/email_verify.php?Email=" + Email,
                type: "POST",
                crossDomain: true,
                async: true,
                cache: false
            }).done(function(response){
                var fieldAssistance = emailElement.siblings(".fieldAssistance");
                if (response == 'valid') {
                    emailElement.removeClass("uvf-invalid");
                    emailElement.addClass("uvf-valid");
                    fieldAssistance.hide();
                } else {
                    emailElement.removeClass("uvf-valid");
                    emailElement.addClass("uvf-invalid");
                    fieldAssistance.show();
                }
                setEmailsValid($scope);
            });
        }
    };

    var validatePhone = function ($scope, phoneElement) {
        var phoneContainer = $(phoneElement).closest(".phone-field");
        var mainPhoneEle = $(phoneContainer).find("input[data-type='complete-phone']");
        var ngValid = $(mainPhoneEle).hasClass("phone-pattern-valid");
        var fieldAssistance = $(phoneContainer).find(".fieldAssistance");
        if (ngValid) {
            var phone = $(mainPhoneEle).attr("data-value");
            $(mainPhoneEle).val(phone);
            fieldAssistance.hide();
        }else{
            if(typeof(fieldAssistance) !== "undefined"){
                fieldAssistance.show();
            }
        }
    };

    // initialize event handlers
    var initializeValidationHandler = function ($scope, validationElements, validate) {
        $.each($(validationElements), function(){
            $(this).on("change", function () {
                validate($scope, $(this));
            });
        });
    };

    var setEmailsValid = function ($scope) {
        $scope.$apply(function () {
            $scope.areEmailsValid = allFieldsValid($scope.allEmailElements);
        });
    };

    var setPhonesValid = function ($scope) {
        $scope.$apply(function () {
            $scope.arePhonesValid = true;
        });
    };

// ex: name='Email'
    var getValidationElements = function ($scope, attrName, attrValue) {
        return $("[ng-controller='" + $scope.ctrlName + "']" + " [" + attrName + "^='" + attrValue + "']");
    };

// ex: type='Email'
    var allFieldsValid = function (elements) {
        var allFields = true;
        $.each(elements, function () {
            if (!($(this).hasClass("uvf-valid"))) {
                allFields = false;
                return false;
            }
        });
        return allFields;
    };

    var initAllValidation = function ($scope) {
        initializeValidationHandler($scope, $scope.allEmailElements, validateEmail);
        initializeValidationHandler($scope, $scope.allPhoneElements, validatePhone);
    };

    var initOnMkDownloadFormLoad = function ($scope) {
        MktoForms2.whenReady(function(form){
            var formId = form.getId();
            if(formId == '1087' || formId == '3550') {
                initAllValidation($scope);
            }
        });
    };

    var initOnMkFormLoadGeneral = function ($scope, optional=function(){}) {
        MktoForms2.loadForm("//app-aba.marketo.com", "302-GJY-034", $scope.marketoFormId, function (form) {
            //Add an onSuccess handler
            form.onSuccess(function (values, followUpUrl) {
                $scope.$apply(function () {
                    $scope.thankyou = true;
                });
                var thankyouMsg = '<div class="head text-center thank-you-msg" ng-show="thankyou"><div class="img-icon"></div><p>Thank you for your submission.<br>A Couchbase representative will contact you shortly.</p></div>';
                var form = $("[ng-controller='" + $scope.ctrlName + "']");
                form.find(".container").replaceWith(thankyouMsg);
                form.css("background-color","#666");

                optional($scope);

                //return false to prevent the submission handler from taking the lead to the follow up url.
                return false;
            });

            initAllValidation($scope);
        });
    };

    var initOnMkFormLoadPopupForm = function($scope){
      initOnMkFormLoadGeneral($scope, repositionForm);
    };

    var initOnMkFormLoadModalForm = function($scope){
      initOnMkFormLoadGeneral($scope, refineModalForm);
    };

    function refineModalForm($scope){
        var form = $("[ng-controller='" + $scope.ctrlName + "']");
        form.addClass("thank-you-submission");
        form.find("#closeBtn path").attr("fill","white");
        form.parent(".fancybox-inner").css("overflow","visible");
    };

    function repositionForm($scope){
        var formHt = $("section#contactPopupForm").outerHeight(true);
        var formTop = ($(window).height() - formHt)*0.5;
        $("section#contactPopupForm").css("top", formTop);
    }

    var initValidationProperties = function ($scope) {
        $scope.allEmailElements = getValidationElements($scope, "data-type", "email");
        $scope.allPhoneElements = getValidationElements($scope, "data-type", "phone");
    };

    var initFormCtrlProperties = function ($scope, $sce, ctrlName, marketoFormId) {
        $scope.ctrlName = ctrlName;
        if (marketoFormId) {
            $scope.marketoFormId = marketoFormId;
        }
        $scope.tosMsg = "";
        $scope.tosName = "";
        $scope.tosRequired = false;
        $scope.thankyou = false;
        $scope.areEmailsValid = false;
        $scope.arePhonesValid = true;
        $scope.allEmailElements = [];
        $scope.allPhoneElements = [];
        $scope.changeCountry = function () {
            changeCountry($scope, $sce);
        };
    };

    var initFormCtrl = function ($scope, $sce, ctrlName, marketoFormId, initOnMkFormLoad) {
        initFormCtrlProperties($scope, $sce, ctrlName, marketoFormId);
        initValidationProperties($scope);
        initOnMkFormLoad($scope);
    };

    var Controller = function (ctrlName, marketoFormId, initFormCtrl, initOnMkFormLoad) {
        app.controller(ctrlName, ['$http', '$scope', '$sce', function ($http, $scope, $sce) {
            initFormCtrl($scope, $sce, ctrlName, marketoFormId, initOnMkFormLoad);
        }]);
    };

    Controller('marketoFormCtrl', '', initFormCtrl, initOnMkDownloadFormLoad);
    Controller('contactFormCtrl', 3306, initFormCtrl, initOnMkFormLoadGeneral);
    Controller('contactUsPageFormCtrl', 4154, initFormCtrl, initOnMkFormLoadGeneral);
    Controller('contactPopupFormCtrl', 3298, initFormCtrl, initOnMkFormLoadPopupForm);
    Controller('pricingFormCtrl', 1149, initFormCtrl, initOnMkFormLoadGeneral);
    Controller('partnerFormCtrl', 2829, initFormCtrl, initOnMkFormLoadModalForm);
    Controller('partnerOpportunityFormCtrl', 3324, initFormCtrl, initOnMkFormLoadModalForm);
    Controller('managedServicesFormCtrl', 4139, initFormCtrl, initOnMkFormLoadGeneral);
    Controller('communityWritersFormCtrl', 2459, initFormCtrl, initOnMkFormLoadGeneral);
    angular.element(function () {
        angular.bootstrap(document, ['validateFormApp']);
    });

})();
