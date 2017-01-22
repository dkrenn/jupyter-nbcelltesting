define([
    'require',
    'jquery',
    'base/js/namespace',
    'base/js/dialog',
    'notebook/js/celltoolbar',
    'base/js/events'

], function (require, $, Jupyter, dialog, celltoolbar, events) {

    var preset_name = 'Cell Testing';

    var CellToolbar = celltoolbar.CellToolbar;


    var prepare_data = function(cell) {
        if (cell.nbcelltesting_data === undefined) {
            cell.nbcelltesting_data = {};
        }
        if (cell.nbcelltesting_data.pending === undefined) {
            cell.nbcelltesting_data.pending = false;
        }
    };


    events.on('execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = true;
        delete cell.nbcelltesting_data.result_test;
        cell.celltoolbar.rebuild();
    });


    events.on('finished_execute.CodeCell', function(event, data) {
        cell = data.cell;
        prepare_data(cell);
        cell.nbcelltesting_data.pending = false;
        test_output(cell);
        cell.celltoolbar.rebuild();
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
        pre = cell.output_area.element.find('div.output_subarea').last().find('pre');
        return pre.text();
    };


    var save_desired_output = function(cell) {
        prepare_metadata(cell);
        cell.metadata.nbcelltesting.desired_output = cell_output(cell);
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


    var edit_nbcelltesting_metadata = function(cell, celltoolbar=null) {
        if (cell.metadata.nbcelltesting === undefined) {
            metadata = {};
        } else {
            metadata = cell.metadata.nbcelltesting;
        }

        notebook = Jupyter.notebook
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


    var compare_output = function(cell) {
        dout = desired_output(cell);
        if (dout === null) {
            return null;
        }
        cout = cell_output(cell);
        return cout === dout;
    };


    var test_output = function(cell) {
        prepare_data(cell);
        var result;
        var cls;
        if (cell.nbcelltesting_data.pending === true) {
            console.log('pending');
            result = '*';
            cls = 'result_test_pending';
        } else {
            comparison_result = compare_output(cell);
            if (comparison_result === null) {
                result = 'n/a';
                cls = 'result_test_not_available';
            } else if (comparison_result === false) {
                result = 'failed';
                cls = 'result_test_failed';
            } else if (comparison_result === true) {
                result = 'passed';
                cls = 'result_test_passed';
            }
        }
        var result_test = $('<a />').addClass('result_test').addClass(cls);
        result_test.append(result);

        cell.nbcelltesting_data.result_test = result_test;
    };


    var result_test = function(cell) {
        if (cell.nbcelltesting_data === undefined ||
            cell.nbcelltesting_data.result_test === undefined) {
            test_output(cell);
        }
        return cell.nbcelltesting_data.result_test;
    };


    var create_result_test = function(div, cell, celltoolbar) {
        $(div).addClass('button_container_result_test')
            .append($('<a />').addClass('result_test_text').append('cell testing '))
            .append(result_test(cell));
    };


    var create_button = function(name, value, callback) {
        return function(div, cell, celltoolbar) {
            var button = document.createElement("input");
            button.type = 'button';
            button.name = name;
            button.value = value;
            button.onclick = function() {
                callback(div, cell, celltoolbar);
            };
            $(div).addClass('button_container_' + name).append(button);
        };
    };


    var on_save_desired_output = function(div, cell, celltoolbar) {
        save_desired_output(cell);
        test_output(cell);
        celltoolbar.rebuild();
    };


    var create_button_save = create_button('save', 'Save Output',
                                           on_save_desired_output);


    var on_reset_desired_output = function(div, cell, celltoolbar) {
        reset_desired_output(cell);
        test_output(cell);
        celltoolbar.rebuild();
    };


    var create_button_reset = create_button('reset', 'Reset Output',
                                            on_reset_desired_output);
  

    var on_edit_nbcelltesting_metadata = function(div, cell, celltoolbar) {
        edit_nbcelltesting_metadata(cell, celltoolbar);
    };


    var create_button_edit = create_button('edit', 'Edit Output',
                                           on_edit_nbcelltesting_metadata);


    var on_test_output = function(div, cell, celltoolbar) {
        test_output(cell);
        celltoolbar.rebuild();
    };


    var create_button_test = create_button('test', 'Test Output',
                                           on_test_output);


    var load_css = function () {
        var link = document.createElement('link');
        link.type = 'text/css';
        link.rel = 'stylesheet';
        link.href = require.toUrl('./nbcelltesting.css');
        document.getElementsByTagName('head')[0].appendChild(link);
    };


    function load_extension(){
        load_css();

        CellToolbar.register_callback('nbcelltesting.result_test', create_result_test);
        CellToolbar.register_callback('nbcelltesting.button_save', create_button_save);
        CellToolbar.register_callback('nbcelltesting.button_reset', create_button_reset);
        CellToolbar.register_callback('nbcelltesting.button_edit', create_button_edit);
        CellToolbar.register_callback('nbcelltesting.button_test', create_button_test);

        var preset = [
            'nbcelltesting.result_test',
            'nbcelltesting.button_save',
            'nbcelltesting.button_reset',
            'nbcelltesting.button_edit',
            'nbcelltesting.button_test',
        ];
        CellToolbar.register_preset(preset_name, preset, Jupyter.notebook);
        console.log('nbcelltesting extension loaded.');
    }


    return {
        load_ipython_extension: load_extension
    };
});









