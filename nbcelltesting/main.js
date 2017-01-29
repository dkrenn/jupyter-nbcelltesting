define([
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'notebook/js/celltoolbar',
    'base/js/events',
    './resources/diff.min'
], function (require,
             $,
             Jupyter,
             dialog,
             notebook_celltoolbar,
             events, JsDiff) {

    var preset_name = 'Cell Testing';

    var CellToolbar = notebook_celltoolbar.CellToolbar;


    var prepare_data = function(cell) {
        if (cell.nbcelltesting_data === undefined) {
            cell.nbcelltesting_data = {};
        }
        if (cell.nbcelltesting_data.pending === undefined) {
            cell.nbcelltesting_data.pending = false;
        }
    };


    events.on('delete.Cell', function(event, data) {
        update_global_result();
    });


    events.on('create.Cell', function(event, data) {
        update_global_result();
    });

    events.on('selected_cell_type_changed.Notebook', function(event, data) {
        update_global_result();
    });

    events.on('execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = true;
        delete cell.nbcelltesting_data.result_test;
        cell.celltoolbar.rebuild();
        update_global_result();
    });


    events.on('finished_execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = false;
        test_output(cell);
        cell.celltoolbar.rebuild();
        update_global_result();
    });


    var prepare_metadata = function(cell) {
        if (cell.metadata.nbcelltesting === undefined) {
            cell.metadata.nbcelltesting = {};
        }
    };


    var cleanup_metadata = function(cell) {
        if (cell.metadata.nbcelltesting !== undefined &&
            Object.keys(cell.metadata.nbcelltesting).length === 0) {
            delete cell.metadata.nbcelltesting
        }
    };


    var cell_output = function(cell) {
        var pre = cell.output_area.element.find('div.output_subarea').last().find('pre');
        return pre.text();
    };


    var _save_desired_output_ = function(cell, output) {
        prepare_metadata(cell);
        cell.metadata.nbcelltesting.desired_output = output;
    };


    var save_current_output = function(cell) {
        return _save_desired_output_(cell, cell_output(cell));
    };


    var desired_output = function(cell) {
        if (cell.metadata.nbcelltesting !== undefined &&
            cell.metadata.nbcelltesting.desired_output !== undefined) {
            return cell.metadata.nbcelltesting.desired_output;
        }
        return null;
    };


    var reset_desired_output = function(cell) {
        if (cell.metadata.nbcelltesting !== undefined &&
            cell.metadata.nbcelltesting.hasOwnProperty("desired_output")) {
            delete cell.metadata.nbcelltesting.desired_output;
            cleanup_metadata(cell);
        }
    };


    var edit_nbcelltesting_metadata = function(cell, celltoolbar) {
        var metadata = {};
        if (cell.metadata.nbcelltesting !== undefined) {
            metadata = cell.metadata.nbcelltesting;
        }

        var notebook = Jupyter.notebook;
        dialog.edit_metadata({
            md: metadata,
            callback: function (md) {
                prepare_metadata(cell);
                cell.metadata.nbcelltesting = md;
                test_output(cell);
                if (celltoolbar !== null) {
                    celltoolbar.rebuild();
                }
            },
            name: 'Cell Testing',
            notebook: notebook,
            keyboard_manager: notebook.keyboard_manager});
    };


    var edit_desired_output = function(cell, celltoolbar=null) {
        var output = desired_output(cell);
        if (output === null) { output = ''; }
        var notebook = Jupyter.notebook
        var error_div = $('<div/>').css('color', 'red');
        var message = 'Edit the desired output of the selected cell below.';

        var textarea = $('<textarea/>')
            .attr('rows', '13')
            .attr('cols', '80')
            .attr('name', 'desired-output')
            .text(output);

        var dialogform = $('<div/>').attr('title', 'Edit Desired Output')
            .append(
                $('<form/>').append(
                    $('<fieldset/>').append(
                        $('<label/>')
                        .attr('for','desired-output')
                        .text(message)
                        )
                        .append(error_div)
                        .append($('<br/>'))
                        .append(textarea)
                    )
            );

        var editor = CodeMirror.fromTextArea(textarea[0], {
            lineNumbers: true,
            matchBrackets: true,
            indentUnit: 2,
            autoIndent: true,
            mode: 'text/plain',
        });

        var modal_obj = dialog.modal({
            title: 'Edit Desired Output',
            body: dialogform,
            buttons: {
                OK: { class : "btn-primary",
                    click: function() {
                        var new_output = editor.getValue();
                        _save_desired_output_(cell, new_output);
                        test_output(cell);
                        celltoolbar.rebuild();
                        update_global_result();
                    }
                },
                Cancel: {}
            },
            notebook: notebook,
            keyboard_manager: notebook.keyboard_manager,
        });

        modal_obj.on('shown.bs.modal', function(){ editor.refresh(); });
    };


    var compare_output = function(cell) {
        var dout = desired_output(cell);
        if (dout === null) {
            return null;
        }
        var cout = cell_output(cell);
        return cout === dout;
    };


    var status = {'pending': {'text': '<span class="fa fa-spinner fa-spin"></span>',
                              'style': 'info',
                              'cls': 'label-info ct-status-pending',
                              'count': 0,
                              'title': 'Number of pending tests'},
                  'not_available': {'text': 'no output saved',
                                    'style': 'info',
                                    'cls': 'label-info ct-status-not_available',
                                    'count': 0,
                                    'title': 'Number of cells without saved output'},
                  'failed': {'text': 'wrong output',
                             'style': 'danger',
                             'cls': 'label-danger ct-status-failed',
                             'count': 0,
                             'title': 'Number of cells with wrong output'},
                  'passed': {'text': 'correct output',
                             'style': 'success',
                             'cls': 'label-success ct-status-passed',
                             'count': 0,
                             'title': 'Number of cells with correct output'},
                 };


    var test_output = function(cell) {
        prepare_data(cell);
        var result;
        var cls;
        if (cell.nbcelltesting_data.pending === true) {
            result = 'pending';
        } else {
            comparison_result = compare_output(cell);
            if (comparison_result === null) {
                result = 'not_available';
            } else if (comparison_result === false) {
                result = 'failed';
            } else if (comparison_result === true) {
                result = 'passed';
            }
        }

        cell.nbcelltesting_data.result_test = result;
    };


    var result_test = function(cell) {
        if (cell.nbcelltesting_data === undefined ||
            cell.nbcelltesting_data.result_test === undefined) {
            test_output(cell);
        }
        return cell.nbcelltesting_data.result_test;
    };


    var diff_wrong_output = function(cell, celltoolbar=null) {
        var diff = JsDiff.diffChars(desired_output(cell), cell_output(cell));

        var modal_body = $('<div/>').addClass('ct-diff-output');
        diff.forEach(function(part) {
            var colorstyle = part.added ? 'added' : (part.removed ? 'removed' : 'common');
            modal_body.append($('<span/>').addClass('ct-diff-output-' + colorstyle)
                              .html(part.value.replace(/\n/g, '<br/>')));
        })

        var notebook = Jupyter.notebook;

        var modal_obj = dialog.modal({
            title: 'Comparison: Desired Output vs. Current Output',
            body: modal_body,
            buttons: {
                OK: {class: 'btn-primary'}
            },
            notebook: notebook,
            keyboard_manager: notebook.keyboard_manager,
        });
    };


    var create_result_test = function(div, cell, celltoolbar) {
        var cell_status = result_test(cell);

        var result = status[cell_status].text;
        var cls = status[cell_status].cls;

        var element = $('<span />').addClass('label result-label').addClass(cls);
        element.append(result);
        element.on('click', function() { on_test_output(cell, celltoolbar); });

        $(div).addClass('ctb-thing result-test')
            .append(element);

        if (cell_status === 'failed') {
            var diffIcon = $('<span/>').addClass('fa fa-lg fa-question-circle ct-diff');
            diffIcon.on('click', function() {diff_wrong_output(cell, celltoolbar);});
            $(div).append(diffIcon)
        }
    };


    var create_button = function(name, value, callback) {
        return function(div, cell, celltoolbar) {
            var button = $('<button/>').addClass('btn btn-default btn-xs')
                .addClass('button-' + name)
                .prop('type', 'button')
                .html(value);
            button.name = name;
            button.on('click', function() { callback(cell, celltoolbar) });
            $(div).addClass('ctb-thing').append(button);
        };
    };


    var on_save_current_output = function(cell, celltoolbar) {
        save_current_output(cell);
        test_output(cell);
        celltoolbar.rebuild();
        update_global_result();
    };


    var create_button_save = create_button('save', 'Save Output',
                                           on_save_current_output);


    var on_reset_desired_output = function(cell, celltoolbar) {
        reset_desired_output(cell);
        test_output(cell);
        celltoolbar.rebuild();
        update_global_result();
    };


    var on_edit_nbcelltesting_metadata = edit_nbcelltesting_metadata;


    var on_edit_desired_output = edit_desired_output;


    var on_test_output = function(cell, celltoolbar) {
        test_output(cell);
        celltoolbar.rebuild();
        update_global_result();
    };


    var actions = [{name: 'Reset Output', callback: on_reset_desired_output},
                   {name: 'Edit Output', callback: on_edit_desired_output},
                   {name: 'Test Output', callback: on_test_output},
                   {name: 'break'},
                   {name: 'Edit Metadata', callback: on_edit_nbcelltesting_metadata}];


    var action_callback = function(action, cell, celltoolbar) {
        return function() { action.callback(cell, celltoolbar); }
    }


    var dropdown_factory = function(actions) {
        return function(div, cell, celltoolbar) {
        var dropdownButton = $('<button/>').addClass('btn btn-default btn-xs dropdown-toggle')
            .prop('type', 'button').attr('data-toggle', 'dropdown')
            .html('<span class="caret"></span>');

        var options = $('<ul/>').addClass('dropdown-menu');

        for (var action of actions) {
            if (action.name === 'break') {
                options.append($('<li/>').attr('role', 'separator').addClass('divider'));
                continue;
            }
            var action_link = $('<a/>').prop('href', '#').html(action.name);
            action_link.on('click', action_callback(action, cell, celltoolbar));
            options.append($('<li/>').append(action_link));
        }

        $(div).addClass('ctb-thing dropdown').append(dropdownButton).append(options);
        };
    };


    var create_dropdown_menu = dropdown_factory(actions);


    var global_status = ['passed', 'pending', 'failed', 'not_available'];


    var update_global_result = function() {
        var n = 0;
        for (var s in status) {
            status[s].count = $('.ct-status-' + s).length
            n += status[s].count;
        }
        for (var s in status) {
            $('#nbcelltesting-global-result-' + s)
                .attr('style', 'width: ' + status[s].count / n * 100 + '%')
                .html(status[s].count);
        }
    };


    events.on('preset_activated.CellToolbar', function(event, preset) {
        create_global_result(preset.name === preset_name);
    });


    var create_global_result = function(show) {
        if (typeof show === 'undefined') { show = true; }
        var element = $('#nbcelltesting-global-result');
        if (show) {
            if (element.length == 0) {
                var progress = $('<div/>')
                    .attr('id', 'nbcelltesting-global-result')
                    .addClass('progress')
                for (var s of global_status) {
                    progress.append(
                        $('<div/>')
                            .attr('id', 'nbcelltesting-global-result-' + s)
                            .addClass('progress-bar progress-bar-' + status[s].style)
                            .attr('role', 'progressbar')
                            .attr('title', status[s].title));
                }
                $("#maintoolbar-container").append(progress);
            }
            update_global_result();
            element = progress;
            element.show();
        } else {
            element.hide();
        }
    };


    var load_css = function () {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = require.toUrl('./nbcelltesting.css');
        document.getElementsByTagName('head')[0].appendChild(link);
    };


    function load_extension(){
        load_css();

        CellToolbar.register_callback('nbcelltesting.result_test',
                                      create_result_test,
                                      ['code']);
        CellToolbar.register_callback('nbcelltesting.button_save',
                                      create_button_save,
                                      ['code']);
        CellToolbar.register_callback('nbcelltesting.dropdown_menu',
                                      create_dropdown_menu,
                                      ['code']);

         var preset = [
            'nbcelltesting.result_test',
            'nbcelltesting.button_save',
            'nbcelltesting.dropdown_menu',
        ];
        CellToolbar.register_preset(preset_name, preset, Jupyter.notebook);
        console.log('nbcelltesting extension loaded.');
    }


    return {
        load_ipython_extension: load_extension,
        load_css: load_css,
        create_button: create_button,
        create_global_result: create_global_result,
        dropdown_factory: dropdown_factory,
        on_reset_desired_output: on_reset_desired_output,
        on_edit_desired_output: on_edit_desired_output,
        on_test_output: on_test_output,
        on_edit_nbcelltesting_metadata: on_edit_nbcelltesting_metadata
    };
});
