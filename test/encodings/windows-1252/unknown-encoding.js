/* Ce plugin gère l'affichage d'une liste de produits:
    - Le templating par lodash
    - Le lazy loading
    - le carroussel
    - les actions de détails et de commande express
    - l'affichage de la disponibilité
  
  En entrée , une liste de produits json et de la configuration

*/

(function ($) {
    // Plugin options par défaut.
    var defaultOptions = {
        fromSearch: false,
        templateProduit: 'Template produit not set',
        templateAchatExpress: 'Template achat express not set',
        templateSansAchat: 'Template sans achat not set',
        notLazyLoadedClass: 'verylazyload',
        enableLazyLoading: true,
        enableCarousel: true,
        enableAchatExpress: true,
        optionsCarousel:
        {
            control:
            {
                wrap: 'circular'
            },
            autoScroll:
            {
                interval: 5000,
                target: '+=1',
                autostart: false
            }
        },
        optionsIframe: {
            id: "srpOverlayPanier",
            loader: true,
            closeButton: true,
            closeText: "Fermer",
            mode: 'iframe',
            onShow: false,
            onClose: false,
            fit: {
                auto: true,
                appendMargin: true,
                width: 580,
                minHeight: 150
            },
            iframeOptions: {
                scrolling: 'no'
            }
        },
        optionsAchatExpress: {
            maxAffiche: 5
        },
        onLoad:null,
        tamponRendering: 100 // défini le nombre d'élément max avant de déclencher le rendu
    };

    var SrpListeProduits = (function (options) {

        function SrpListeProduits(container, options) {
            this.container = container;
            this.controlsToAdd;

            // Ajouter control sur les options et la présence de lodash
            $.extend(true, this, defaultOptions, options);

            // Compilation des templates
            this.compiledTemplate = _.template(this.templateProduit);
            this.compiledTemplateAchatStandard = _.template(this.templateAchatStandard);
            this.compiledTemplateAchatExpress = _.template(this.templateAchatExpress);
            this.compiledTemplateSansAchat = _.template(this.templateSansAchat);
        };

        // Mise à jour des options du plugin.
        SrpListeProduits.prototype.update = function (options) {
            $.extend(true, this, options);
        };

        SrpListeProduits.prototype.render = function (listeProduits, addToResults) {
            var component = this;
            var i, j;
            var chunks = [];
            for (i = 0, j = listeProduits.length; i < j; i += this.tamponRendering) {
                chunks.push(listeProduits.slice(i, i + this.tamponRendering));
            }

            if (addToResults !== true) { this.container.html(' '); }

            var container = $('<div class="page"></div>');
            this.container.append(container);

            _.forEach(chunks,
                function(chunk) {
                    component.renderChunk(chunk, container);
                });

            //On load event
            if (component.onLoad != null && _.isFunction(component.onLoad)) {
                component.onLoad(component, listeProduits);
            }
        };

        SrpListeProduits.prototype.renderChunk = function (listeProduits, container) {

            //console.time("StartProductRender");
            var component = this;
            var htmlListeProduits = "";
            _.forEach(listeProduits, function (produit) {
                produit.boutons = "";
                if (component.enableAchatExpress && produit.tfp != 3) {
                    produit.achatExpress = component.compiledTemplateAchatExpress(produit);
                } else {
                    produit.achatExpress = component.compiledTemplateSansAchat(produit);
                }

                htmlListeProduits += component.compiledTemplate(produit);
            });

            component.controlsToAdd = $(htmlListeProduits);
            container.append(component.controlsToAdd);

            //console.time("StartLazy");
            if (this.enableLazyLoading === true) {
                this.renderLazyLoad(component.controlsToAdd);
            }
            //console.timeEnd("StartLazy");

            //console.time("StartCarousel");
            if (this.enableCarousel === true) {
                this.renderCarousel(component.controlsToAdd, component.optionsCarousel);
            }
            //console.timeEnd("StartCarousel");

            //console.time("StartProductExpress");
            if (this.enableAchatExpress === true) {
                this.renderAchatExpress(component.controlsToAdd, this.optionsAchatExpress);
            }
            //console.timeEnd("StartProductExpress");
            //console.timeEnd("StartProductRender");
        }

        SrpListeProduits.prototype.clear = function () {
            this.container.html('');
        }

        SrpListeProduits.prototype.renderLazyLoad = function ($addedProducts) {
            var component = this;
            $addedProducts.find('img[data-original]:first').lazyload({
                threshold: 500
            });
        }

        SrpListeProduits.prototype.renderCarousel = function ($addedProducts, optionsCarousel) {
            $addedProducts.hover(function () {
                var isInit = $(this).prop("cInit") || false;
                if (!isInit) {
                    $(this).prop("cInit", true);
                    $(this).find('.jcarousel').jcarousel(optionsCarousel.control).jcarouselAutoscroll(optionsCarousel.autoScroll);

                    $(this).find('.jcarousel-control-prev,.jcarousel-control-next')
                        .click(function () {
                            var $imgs = $(this).closest('.jcarousel-wrapper').find('img');
                            _.forEach($imgs, function (img) {
                                if ($(img).attr('src') != $(img).data('original'))
                                    $(img).attr('src', $(img).data('original'));
                            });
                        });

                    $(this).find('.jcarousel-control-prev').bind('jcarouselcontrol:active', function () {
                        $(this).removeClass('inactive');
                    })
                        .bind('jcarouselcontrol:inactive', function () { $(this).addClass('inactive'); })
                        .jcarouselControl({ target: '-=1' });

                    $(this).find('.jcarousel-control-next')
                        .bind('jcarouselcontrol:active', function () { $(this).removeClass('inactive'); })
                        .bind('jcarouselcontrol:inactive', function () { $(this).addClass('inactive'); })
                        .jcarouselControl({ target: '+=1' });

                    $(this).find('.jcarousel-pagination a').bind('jcarouselpagination:active', function () { $(this).addClass('active'); });
                    $(this).find('.jcarousel-pagination a').bind('jcarouselpagination:inactive', function () { $(this).removeClass('active'); });
                    $(this).find('.jcarousel-pagination').jcarouselPagination();
                }
            });
        }

        SrpListeProduits.prototype.renderAchatExpress = function ($addedProducts, achatExpressOptions) {
            var achatExpressOptions = achatExpressOptions || {};
            var component = this;
            function loadQuantiteDropdDown($this) {
                var $laDivProduit = $this.closest('.bloc_product');

                // Mise à jour de la drop downlist des quantités
                var aAfficher = $this.data("qte");
                var selectQty = $laDivProduit.find('.fp__select_quantite select');

                if (aAfficher) {
                    if (aAfficher > achatExpressOptions.maxAffiche) {
                        aAfficher = achatExpressOptions.maxAffiche;
                    }

                    var qtesDispo = _.range(1, aAfficher + 1);
                    var taillesHtml = "";
                    _.forEach(qtesDispo, function (i) {
                        taillesHtml += '<option value="' + i + '">' + i + '</option>';
                    });

                    selectQty.html(taillesHtml);
                    selectQty.find("option:first").prop("selected", true);
                    selectQty.change();
                    selectQty.selectmenu("enable");
                }
                else {
                    var defaultText = selectQty.data("defaulttext");
                    selectQty.html('<option>' + defaultText + '</option>');
                    $laDivProduit.find('.fp__select_quantite select').html();
                    selectQty.selectmenu("disable");
                }
                selectQty.selectmenu("refresh");
            }

            // Ajout au panier
            var btnAdds = $addedProducts.not('.epuise').find('.btn_add');
            btnAdds.click(function () {
                var $laDivProduit = $(this).closest('.bloc_product');
                var vid = $laDivProduit.data("vid"); // Identifiant de la vente
                var pid = $laDivProduit.data("pid"); // Identifiant du produit
                var tid = $laDivProduit.find(".fp__select_taille select").val(); // Identifiant de la taille
                var qte = $laDivProduit.find(".fp__select_quantite select").val(); // Quantité séléctionnée
                component.addToCart(vid, pid, tid, qte);
            });

            // Survol du bouton commander
            btnAdds.hover(function () {
                var $laDivProduit = $(this).closest('.bloc_product');
                var cartChoice = $laDivProduit.find('.bloc_produit__item-box');
                cartChoice.stop(true, true).fadeIn({ duration: 400 });
            });

            // Gestion des listes de choix personnalisées
            // si une seule taille pour le produit, sélection par défaut
            $addedProducts.find('.fp__select_taille select').each(function (index, item) {
                if ($(item).find("option[value]").length == 1) {
                    $(item).find("option[value]").prop("selected", true);
                }
            });

            $addedProducts
                .hover(function () {
                    var $blocProduct = $(this);
                    var $blocProductSelectTaille = $blocProduct.find('.fp__select_taille select');
                    var $blocProductSelectQty = $blocProduct.find('.fp__select_quantite select');
                    var isInit = $blocProduct.prop("aeInit") || false;
                    if (!isInit) {
                        $blocProduct.prop("aeInit", true);
                        var itemId = $blocProduct.prop('id');

                        $blocProduct.find('.bloc_produit__express_buy').mouseleave(function () {
                            var cartChoice = $blocProduct.find('.bloc_produit__item-box');
                            $blocProductSelectTaille.selectmenu("close");
                            $blocProductSelectQty.selectmenu("close");
                            cartChoice.fadeOut({ duration: 400 });
                        });

                        $blocProductSelectQty
                            .selectmenu({
                                appendTo: "#" + itemId + " .bloc_produit__express_buy",
                                disabled: true
                            });

                        $blocProductSelectTaille
                            .selectmenu({
                                appendTo: "#" + itemId + " .bloc_produit__express_buy",
                                change: function () {
                                    var $laDivProduit = $(this).closest('.bloc_product');
                                    $laDivProduit.find('.size_error_c').hide();
                                    loadQuantiteDropdDown($(this).find('option:selected'));
                                    $laDivProduit.find('.fp__select_quantite select').selectmenu("refresh");
                                },
                                create: function () {
                                    var selectedSizeItem = $blocProductSelectTaille.find('option:selected');
                                    if (selectedSizeItem.attr("value")) {
                                        loadQuantiteDropdDown(selectedSizeItem);
                                    }

                                    // On masque les selection de tailles sur les fiches produits 2 et 4
                                    if ($blocProduct.hasClass("bloc_product_2") || $blocProduct.hasClass("bloc_product_4")) {
                                        $blocProductSelectTaille.selectmenu("widget").hide();
                                    }
                                }
                            });
                    }
                });
        };

        SrpListeProduits.prototype.addToCart = function (vid, pid, tid, qte, offerId) {
            var component = this;
            var offerId = offerId || false;

            if (isNaN(vid) || isNaN(pid) || isNaN(tid) || isNaN(qte)
                || vid == 0 || pid == 0 || tid == 0 || qte == 0) {
                $('#bloc_product_' + pid + ' .size_error_c').show();
            }
            else {
                $laDivProduit = $('#bloc_product_' + pid);
                if (isNaN(tid) || tid == 0) {
                    $laDivProduit.find('.size_error_c').show();
                }
                else {

                    if (!isNaN(vid) && !isNaN(pid) && !isNaN(tid) && !isNaN(qte)
                                       && vid > 0 && pid > 0 && tid > 0 && qte > 0) {

                        var panierOverlay = new SrpOverlay(component.optionsIframe);

                        // AB TEST recommandation produits
                        var abTestArgs = "";
                        if (window["AB_active"] && "ve" in window && "re" in window) {
                            abTestArgs = "&ve=" + window["ve"] + "&re=" + window["re"];
                        }

                        // Ajout de l'offreId de personali
                        var offerIdArgs = "";
                        if (offerId) {
                            offerIdArgs = "&o=" + offerId;
                        }

                        // Vérification du disclaimenr si présent
                        var discId = $laDivProduit.data("discid");
                        if (discId) {
                            var hasDisclaimerAlert = srpDisclaimerApi.checkDisclaimer(discId, vid, function () {
                                panierOverlay.show("/MonPanier/Iframe/AjoutPanier.aspx?p=" + pid + "&m=" + tid + "&q=" + qte + abTestArgs + offerIdArgs);
                            });

                            if (hasDisclaimerAlert) {
                                return false;
                            }
                        }

                        panierOverlay.show("/MonPanier/Iframe/AjoutPanier.aspx?p=" + pid + "&m=" + tid + "&q=" + qte + abTestArgs + offerIdArgs);

                        // Lance un evenment TagCommander
                        try {
                            var p = component.getTcInfos(vid, pid, tid, qte);
                            if (offerId) {
                                p.offerId = offerId;
                            }
                            EVENTS_TC.AddCartEvent(p, component.fromSearch);
                        } catch (e) {
                            SRP.ConsoleLog(e)
                        }
                    }
                }
            }
        };

        SrpListeProduits.prototype.getTcInfos = function (vid, pid, tid, qte) {
            var component = this;
            var $laDivProduit = $('#bloc_product_' + pid);
            var p = {};
            p.id = pid;
            p.vid = vid;
            p.qte = qte;
            p.taille = $laDivProduit.find(".fp__select_taille select option:selected").text().trim();
            p.name = $laDivProduit.find(".bloc_produit__item-nom")[0].innerText.trim();
            if (component.fromSearch) {
                p.brand = $laDivProduit.find(".nom_vente--item")[0].textContent || '';
            } else {
                p.brand = tc_vars.page_sale_name;
            }
            if (component.fromSearch) {
                p.cat = '';
            } else {
                p.cat = tc_vars.page_category_name;
            }
            p.price = $laDivProduit.find(".bloc_produit__item-prix")[0].innerText.replace(',', '.').replace(/(\s+)?.$/, '');
            p.currency = '€';
            //p.type = $laDivProduit.find(".fp__select_quantite select").val();
            p.decote = $laDivProduit.find(".bloc_produit__item-decote").length > 0 ? $laDivProduit.find(".bloc_produit__item-decote")[0].innerText : '';
            p.img = $laDivProduit.find(".jcarousel img").attr('src');
            return p;
        };

        return SrpListeProduits;
    })();

    /* Jquery plugin pattern */
    $.fn.srpListeProduits = function (options) {
        // Création ou mise à jour de l'instance
        if (!$(this).data('srpListeProduits')) {
            $(this).data('srpListeProduits', new SrpListeProduits(this, options || {}));
        } else {
            $(this).data('srpListeProduits').update(options || {});
        }

        $(this).show();
        return $(this).data('srpListeProduits');
    };
})(jQuery);

function addToCartAdjusted(offerId, pid)
{
    var $blocProduit = $('#bloc_product_' + pid);
    var $container = $blocProduit.closest(".listItems");
    var component = $container.srpListeProduits();
    if ($blocProduit.length > 0 && $container.length  > 0 && component)
    {
        var vid = $blocProduit.data("vid");
        var tid = $blocProduit.find(".fp__select_taille select").val();
        var qte = $blocProduit.find(".fp__select_quantite select").val();
        component.addToCart(vid, pid, tid, qte, offerId);
    }
}