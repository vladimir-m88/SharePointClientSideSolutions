; (function () {

    // Объект для хранения данных внутри модуля.
    var module = {};
    module.listId = "AF927D0C-E108-4EA1-AA15-B6D38FD00531";

    // Устанавливаем обработчик события загрузки страницы.
    $(document).ready(function () {
        var scriptbase = _spPageContextInfo.webAbsoluteUrl + "/_layouts/15/";
        // Подключаем необходимые для работы CSOM скрипты
        $.getScript(scriptbase + "SP.Runtime.js", function () {
            $.getScript(scriptbase + "SP.js", function () {
                $.getScript(scriptbase + "reputation.js", function () {
                    retrieveListItems();
                });
            });
        });
        // Устанавливаем обработчик события нажатия на кнопку лайка
        $(".competitions-main table").on("click", ".custom-like-button", function () {
            $(this).html("...");
            setLike(module.listId, $(this).data("id"), !($(this).data("likeisset")));
        });
    });

    // Функция извлекающая данные из списка.
    function retrieveListItems() {
        var clientContext = new SP.ClientContext();
        var oList = clientContext.get_web().get_lists().getById(module.listId);
        var camlQuery = new SP.CamlQuery();
        module.collListItem = oList.getItems(camlQuery);
        clientContext.load(module.collListItem);
        clientContext.executeQueryAsync(onQuerySucceeded, onQueryFailed);
    }

    // Успешное извлечение данных из списка.
    function onQuerySucceeded(sender, args) {
        var html = "<tr><th>ФИО, структурное подразделение участаника</th><th>Фото/картинка</th><th>Количество голосов</th></tr>";
        var listItemEnumerator = module.collListItem.getEnumerator();
        while (listItemEnumerator.moveNext()) {
            var oListItem = listItemEnumerator.get_current();
            html += "<tr><td class=\"name-column\">" + oListItem.get_item('Title') +
                    "</td><td>" + oListItem.get_item('_x0424__x043e__x0442__x043e__x00') +
                    "</td><td><div class=\"like-block\" id=\"" + oListItem.get_item('ID') + "\"></div></td></tr>";
            getRating(module.listId, oListItem.get_item('ID'));
        }
        $(".competitions-main table").html(html);
    }

    // Неудачная попытка извлечения данных из списка.
    function onQueryFailed(sender, args) {
        console.log('Request failed. ' + args.get_message() + '\n' + args.get_stackTrace());
    }

    // Функция установки/снятия "лайка"
    function setLike(listId, itemId, like) {
        var ctx = SP.ClientContext.get_current();
        Microsoft.Office.Server.ReputationModel.Reputation.setLike(ctx, listId, itemId, like);
        ctx.executeQueryAsync(
            function () {
                // успешно
                console.log('Статус лайка успешно изменен.');
                getRating(listId, itemId);
            }, function (sender, args) {
                // ошибка
                getRating(listId, itemId);
                console.log('Request failed (function setLike()). ' + args.get_message() + '\n' + args.get_stackTrace());
            }
        );
    }

    // Функция, которая возвращает информацию о "лайках" записи.
    function getRating(listId, itemId) {
        var ctx = SP.ClientContext.get_current();
        var list = ctx.get_web().get_lists().getById(listId);
        var listItem = list.getItemById(itemId);
        ctx.load(listItem, "Title", "LikedBy", "ID", "LikesCount");
        ctx.executeQueryAsync(
            // успешно
            function () {
                var likeButtonText = "";
                var html = "";
                var selector = "";
                var likesCount;
                var likedUserList; // массив, содержащий объкты с данными всех пользователей, которые установили "лайк"
                var likeIsSetByCurrentUser;
                likesCount = Number(listItem.get_item('LikesCount'));
                if (likesCount < 0) {
                    likesCount = 0;
                }
                likedUserList = listItem.get_item('LikedBy');
                likeIsSetByCurrentUser = fLikeIsSetByCurrentUser(likedUserList);
                if (likeIsSetByCurrentUser) {
                    likeButtonText = "Отозвать голос";
                } else {
                    likeButtonText = "Голосовать";
                }
                html = "<div class=\"custom-like-button\" data-id=" + itemId + " data-likeisset=" + likeIsSetByCurrentUser + ">" + likeButtonText + "</div><div>Всего голосов: " + likesCount + "</div>";
                selector = ".competitions-main table .like-block#" + itemId;
                $(selector).html(html);
            },
            // ошибка
            function (sender, args) {
                console.log('Request failed (function getRating()). ' + args.get_message() + '\n' + args.get_stackTrace());
            }
        );
    }

    // Функция, которая проверяет установлен ли "лайк" текущим пользователем.
    function fLikeIsSetByCurrentUser(likedUserList) {
        if (!SP.ScriptHelpers.isNullOrUndefined(likedUserList)) {
            console.log(likedUserList);
            for (var i = 0; i < likedUserList.length; i++) {
                if (likedUserList[i].$1E_1 === _spPageContextInfo.userId) {
                    return true;
                }
            }
        }
        return false;
    }

})();