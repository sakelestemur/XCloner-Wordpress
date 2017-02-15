class Xcloner_Restore{

	constructor(hash)
	{
		this.steps = ['restore-script-upload-step','backup-upload-step','restore-remote-backup-step','restore-remote-database-step','restore-finish-step']
		this.ajaxurl = ajaxurl;
		this.cancel = false;
		this.upload_file_event = new Event('upload_file_event');
		this.resume = new Object();
		this.hash = hash;
		
		document.addEventListener("backup_upload_finish", function (e) {
			
			jQuery(".xcloner-restore .backup-upload-step .toggler").removeClass("cancel");

		}, false);
		
		document.addEventListener("remote_restore_backup_finish", function (e) {
			
			jQuery(".xcloner-restore .restore-remote-backup-step .toggler").removeClass("cancel");

		}, false);
		
		document.addEventListener("remote_restore_mysql_backup_finish", function (e) {
			
			jQuery(".xcloner-restore .restore-remote-database-step .toggler").removeClass("cancel");

		}, false);
		
		document.addEventListener("restore_script_invalid", function (e) {
						
			jQuery(".xcloner-restore #restore_script_url").addClass("invalid").removeClass('valid');
			jQuery(".xcloner-restore #validate_url .material-icons").text("error");
				
		}, false);
		
		document.addEventListener("restore_script_valid", function (e) {
			
			jQuery(".xcloner-restore #validate_url .material-icons").text("check_circle");
			jQuery(".xcloner-restore #restore_script_url").removeClass("invalid").addClass('valid');
				
		}, false);
		
		document.addEventListener("xcloner_populate_remote_backup_files_list", function (e) {
			
			var files = e.detail.files
			
			jQuery('.xcloner-restore #remote_backup_file').find('option').not(':first').remove();
			
			
			for( var key in files)
			{
				if(files[key].selected)
					var selected = "selected";
				else
					var selected = "not-selected";
					
				jQuery('.xcloner-restore #remote_backup_file').append("<option value='"+files[key].path+"' "+selected+">"+files[key].path+"("+e.detail.$this.getSize(files[key].size)+" MB)"+"</option>").addClass("file");
			}
				
		}, false);
		
		document.addEventListener("xcloner_populate_remote_mysqldump_files_list", function (e) {
			
			var files = e.detail.files
			
			jQuery('.xcloner-restore #remote_database_file').find('option').not(':first').remove();
			
			for( var key in files)
			{
				if(files[key].selected)
					var selected = "selected";
				else
					var selected = "not-selected";
					
				var option = jQuery('.xcloner-restore #remote_database_file').append("<option value='"+files[key].path+"' "+selected+">"+files[key].path+"("+e.detail.$this.getSize(files[key].size)+" MB) "+files[key].timestamp+"</option>").addClass("file");
			}
				
		}, false);
		
		document.addEventListener("xcloner_restore_next_step", function (e) {
			
			if(e.detail.$this !== undefined)
			{
				var $this = e.detail.$this
				jQuery(".xcloner-restore li."+$this.steps[$this.set_current_step]).addClass('active').show().find(".collapsible-header").trigger('click');
			}
				
		}, false);
		
		document.addEventListener("xcloner_restore_update_progress", function (e) {
			
			if(e.detail.percent !== undefined)
			{
				jQuery(".xcloner-restore .steps.active .progress").show();
				
				if(e.detail.class == "indeterminate")
					jQuery(".xcloner-restore .steps.active .progress > div").addClass(e.detail.class).removeClass('determinate')
				if(e.detail.class == "determinate")
					jQuery(".xcloner-restore .steps.active .progress > div").addClass(e.detail.class).removeClass('indeterminate')
				
				if(e.detail.percent == 100)
					jQuery(".xcloner-restore .steps.active .progress > div").removeClass('indeterminate').addClass('determinate').css("width", e.detail.percent+"%")	
				else	
					jQuery(".xcloner-restore .steps.active .progress .determinate").css("width", e.detail.percent+"%")
			}
				
		}, false);
		
		
		document.addEventListener("xcloner_restore_display_status_text", function (e) {
			
			if(e.detail.status === undefined)
				e.detail.status = "updated";
				
			if(e.detail.message !== undefined)
			{
				jQuery(".xcloner-restore .steps.active .status").html("<div class='"+e.detail.status+"'>"+e.detail.message+"</div>");
			}
				
		}, false);
		
		document.addEventListener("xcloner_populate_remote_restore_path", function (e) {
			
			if(e.detail.dir !== undefined)
			{
				if(!jQuery(".xcloner-restore #remote_restore_path").val())
					jQuery(".xcloner-restore #remote_restore_path").val(e.detail.dir);
			}
			
			if(e.detail.restore_script_url !== undefined)
			{
				if(!jQuery(".xcloner-restore #remote_restore_url").val())
					jQuery(".xcloner-restore #remote_restore_url").val(e.detail.restore_script_url);
			}
				
		}, false);
		
		document.addEventListener("remote_restore_update_files_list", function (e) {
			
			if(e.detail.files !== undefined && e.detail.files.length)
			{
				for(var i=0; i<e.detail.files.length;i++)
				jQuery('.xcloner-restore .restore-remote-backup-step .files-list').prepend(e.detail.files[i]+"<br />")
			}else
				jQuery('.xcloner-restore .restore-remote-backup-step .files-list').html("");
				
		}, false);
		
		
	}
	
	get_remote_backup_files_callback(response, status, params = new Object())
	{
		if(status)
		{
			var files = response.statusText.files;
			document.dispatchEvent(new CustomEvent("xcloner_populate_remote_backup_files_list", {detail: {files: files, $this: this }}));
		}
	}
	
	get_remote_backup_files()
	{
		this.ajaxurl = this.restore_script_url;
		this.set_cancel(false);
		
		var params = new Object()
		params.local_backup_file = jQuery(".xcloner-restore .backup-upload-step #backup_file").val();
		
		this.do_ajax('get_remote_backup_files_callback', 'list_backup_archives', params)
		
		this.get_remote_restore_path_default()
	}
	
	get_remote_mysqldump_files_callback(response, status, params = new Object())
	{
		if(status)
		{
			var files = response.statusText.files;
			document.dispatchEvent(new CustomEvent("xcloner_populate_remote_mysqldump_files_list", {detail: {files: files, $this: this }}));
		}
	}
	
	get_remote_mysqldump_files()
	{
		this.ajaxurl = this.restore_script_url;
		this.set_cancel(false);
		
		
		if(this.resume.callback == "get_remote_mysqldump_files_callback")
		{
			console.log("do resume");
			this.do_ajax(this.resume.callback, this.resume.action, this.resume.params);
			this.resume = new Object();
			return;
		}
		
		
		var params = new Object()
		params.backup_file = this.get_backup_file()
		params.remote_path = this.get_remote_path()
		
		//console.log(params)
		
		this.do_ajax('get_remote_mysqldump_files_callback', 'list_mysqldump_backups', params)
		
	}
	
	get_backup_file()
	{
		return jQuery(".xcloner-restore #remote_backup_file").val()
	}
	
	get_remote_path()
	{
		return jQuery(".xcloner-restore #remote_restore_path").val()
	}
	
	get_remote_restore_path_default_callback(response, status, params = new Object())
	{
		if(status)
		{
			document.dispatchEvent(new CustomEvent("xcloner_populate_remote_restore_path", {detail: {dir: response.statusText.dir, restore_script_url: response.statusText.restore_script_url, $this: this }}))
		}
	}
	
	get_remote_restore_path_default()
	{
		this.ajaxurl = this.restore_script_url;
		this.set_cancel(false);
		
		var params = new Object()
		
		params.restore_script_url = this.restore_script_url;
		
		this.do_ajax('get_remote_restore_path_default_callback', 'get_current_directory', params)
	}
	
	remote_restore_backup_file_callback(response, status, params = new Object())
	{
		
		if(!status)
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: response.status+" "+response.statusText }}));
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 100 }}));
			document.dispatchEvent(new CustomEvent("remote_restore_backup_finish"));
			return;
		}
		
		var processed = parseInt(response.statusText.start)+parseInt(response.statusText.processed)
		
		if(response.statusText.extracted_files)
		{
			//console.log(response.statusText.extracted_files);
			document.dispatchEvent(new CustomEvent("remote_restore_update_files_list", {detail: {files: response.statusText.extracted_files}}));
		}
			
		if(!response.statusText.finished)
		{
			params.start = response.statusText.start
			params.part = response.statusText.part
			params.processed = response.statusText.processed
			
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: 'Processing <strong>'+response.statusText.backup_file+'</strong>- wrote '+this.getSize(processed, 1024)+" KB to disk"}}));
			
			this.do_ajax('remote_restore_backup_file_callback', 'restore_backup_to_path', params)
			return
		}
		
		document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 100 }}));
		document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: "Done restoring <strong>"+ response.statusText.backup_file +"</strong>."}}));
		document.dispatchEvent(new CustomEvent("remote_restore_backup_finish"));
		this.cancel = false;
	}
	
	remote_restore_backup_file(backup_file, remote_path)
	{
		this.ajaxurl = this.restore_script_url;
		this.set_cancel(false);
		
		var params = new Object()
		params.backup_file = backup_file
		params.remote_path = remote_path
		
		if(this.resume.callback == "remote_restore_backup_file_callback")
		{
			console.log("do resume");
			this.do_ajax(this.resume.callback, this.resume.action, this.resume.params);
			this.resume = new Object();
			return;
		}
		document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 0, class: 'indeterminate' }}));
		document.dispatchEvent(new CustomEvent("remote_restore_update_files_list", {detail: {files: ""}}));
		
		this.do_ajax('remote_restore_backup_file_callback', 'restore_backup_to_path', params)
	}
	
	remote_restore_mysql_backup_file_callback(response, status, params = new Object())
	{
		
		if(!status)
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: response.status+" "+response.statusText }}));
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 100 }}));
			document.dispatchEvent(new CustomEvent("remote_restore_mysql_backup_finish"));
			return;
		}
		
		var processed = parseInt(response.statusText.start)+parseInt(response.statusText.processed)
		
		if(response.statusText.extracted_files)
		{
			//console.log(response.statusText.extracted_files);
			//document.dispatchEvent(new CustomEvent("remote_restore_update_files_list", {detail: {files: response.statusText.extracted_files}}));
		}
			
		if(!response.statusText.finished)
		{
			params.start = response.statusText.start
			params.processed = response.statusText.processed
			
			var percent = 0;
			
			if(response.statusText.backup_size)
				percent = (100*parseInt(response.statusText.start))/parseInt(response.statusText.backup_size);
			
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: 'Processing <strong>'+response.statusText.backup_file+'</strong>- wrote '+this.getSize(response.statusText.start, 1024)+" KB of data"}}));
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: percent }}));
			
			this.do_ajax('remote_restore_mysql_backup_file_callback', 'restore_mysql_backup', params)
			return
		}
		
		document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 100 }}));
		document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: "Done restoring <strong>"+ response.statusText.backup_file +"</strong>."}}));
		document.dispatchEvent(new CustomEvent("remote_restore_mysql_backup_finish"));
		this.cancel = false;
		
	}
	
	restore_finish_callback(response, status, params = new Object())
	{
		if(status)
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: response.statusText, $this: this }}))
		}else{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: "error", message: response.statusText, $this: this }}))
		}
	}
	
	restore_finish()
	{
		this.ajaxurl = this.restore_script_url;
		this.set_cancel(false);
		
		var params = new Object()
		
		params.remote_mysql_host 	= jQuery(".xcloner-restore #remote_mysql_host").val();
		params.remote_mysql_db 		= jQuery(".xcloner-restore #remote_mysql_db").val();
		params.remote_mysql_user 	= jQuery(".xcloner-restore #remote_mysql_user").val();
		params.remote_mysql_pass 	= jQuery(".xcloner-restore #remote_mysql_pass").val();
		params.remote_path 			= jQuery(".xcloner-restore #remote_restore_path").val();
		params.remote_restore_url 	= jQuery(".xcloner-restore #remote_restore_url").val();
		
		params.delete_backup_temporary_folder 	= 0;
		params.delete_restore_script 			= 0;
		params.update_remote_site_url 			= 0;
			
		if(jQuery(".xcloner-restore #delete_backup_temporary_folder").is(":checked"))
			params.delete_backup_temporary_folder 	= 1;
		if(jQuery(".xcloner-restore #delete_restore_script").is(":checked"))
			params.delete_restore_script 			= 1;
		if(jQuery(".xcloner-restore #update_remote_site_url").is(":checked"))
			params.update_remote_site_url 			= 1;

		this.do_ajax('restore_finish_callback', 'restore_finish', params)
	
	}
	
	remote_restore_mysql_backup_file(mysqldump_file)
	{
		this.ajaxurl = this.restore_script_url;
		this.set_cancel(false);
		
		var params = new Object()
		
		params.remote_mysql_host 	= jQuery(".xcloner-restore #remote_mysql_host").val();
		params.remote_mysql_db 		= jQuery(".xcloner-restore #remote_mysql_db").val();
		params.remote_mysql_user 	= jQuery(".xcloner-restore #remote_mysql_user").val();
		params.remote_mysql_pass 	= jQuery(".xcloner-restore #remote_mysql_pass").val();
		params.remote_path 			= jQuery(".xcloner-restore #remote_restore_path").val();
		params.remote_restore_url 	= jQuery(".xcloner-restore #remote_restore_url").val();
		params.mysqldump_file 		= mysqldump_file

		
		if(this.resume.callback == "remote_restore_mysql_backup_file_callback")
		{
			console.log("do resume mysql backup restore");
			this.do_ajax(this.resume.callback, this.resume.action, this.resume.params);
			this.resume = new Object();
			return;
		}
		
		this.do_ajax('remote_restore_mysql_backup_file_callback', 'restore_mysql_backup', params)
	}
	
	upload_backup_file(file)
	{
		this.ajaxurl = ajaxurl;
		var params = new Object()
		this.set_cancel(false);
		
		if(this.resume.callback == "upload_backup_file_callback")
		{
			this.do_ajax(this.resume.callback, this.resume.action, this.resume.params);
			this.resume = new Object();
			return;
		}
		
		params.file = file;
		params.start = 0;
		params.target_url = this.restore_script_url
		
		document.dispatchEvent(new CustomEvent("backup_upload_start"));
		document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: "Uploading backup 0%" }}));
		document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 0 }}));
		
		this.do_ajax('upload_backup_file_callback', 'restore_upload_backup', params)
	}
	
	
	upload_backup_file_callback(response, status, params = new Object())
	{
		if(!status)
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: response.status+" "+response.statusText }}));
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 100 }}));
			return;
		}	
		
		if(response && (response.start !== false || response.part<response.total_parts))
		{
			var percent = 0;
			if(response.total_size)
			{
				if(!response.start)
					response.start = 0;
				var size = parseInt(response.start)+parseInt(response.uploaded_size)
				percent = (100*parseInt(size))/parseInt(response.total_size)
			}
			
			var part_text = "";
			if(response.part > 0)
				part_text = "part "+response.part+" -  ";
			
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: percent }}));
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: "Uploading backup "+part_text+parseFloat(percent).toFixed(2)+"%" }}));
			
			params.start = response.start;
			params.part = response.part;
			params.uploaded_size = response.uploaded_size;
			this.do_ajax('upload_backup_file_callback', 'restore_upload_backup', params)
		}
		else
		{
			this.cancel = false
			document.dispatchEvent(new CustomEvent("backup_upload_finish"));
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 100 }}));
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: "Done." }}));
		}
	}
	
	verify_restore_url(response, status, params = new Object())
	{
		this.ajaxurl = this.restore_script_url;
		
		if(!response)
		{	
			this.cancel = false;
			this.set_current_step = 0
			this.do_ajax("verify_restore_url");
		}else{	
			
			if(!status)
			{
				document.dispatchEvent(new CustomEvent("restore_script_invalid"));
				document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status:'error', message: response.status+" "+response.statusText }}));
				//document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 100 }}));
				
			}else{
				
				document.dispatchEvent(new CustomEvent("restore_script_valid"));
				document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: "Validation ok." }}));
				
				this.next_step();
			}
		}	
	}
	
	next_step()
	{
		this.set_current_step = jQuery(".xcloner-restore li.active").attr("data-step");
		
		document.dispatchEvent(new CustomEvent("xcloner_restore_next_step", {detail: {$this: this}}));
		
	}
	
	init_resume()
	{
		this.resume = new Object()
		if(jQuery(".xcloner-restore .steps.active .progress").is(":visible"))
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 0 }}));
		if(jQuery(".xcloner-restore .steps.active .status").html())
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {message: ""}}));
		document.dispatchEvent(new CustomEvent("remote_restore_update_files_list", {detail: {files: ""}}));
	}
	
	do_ajax(callback, action="", params= new Object())
	{
		params.action = action
		params.hash = this.hash
		
		if(this.cancel == true)
		{
			this.resume.callback = callback
			this.resume.action = action
			this.resume.params = params
			
			//this.request.abort();
			
			return;
		}
		
		if(!this.restore_script_url)
			return false;
		
		var $this = this;
		
		jQuery(".xcloner-restore .steps.active").addClass("active_status");
		
		this.request = jQuery.ajax({
			url: this.ajaxurl,
			dataType: 'json',
			type: 'POST',
			data: params,
			error: function(xhr, status, error) {
					document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: xhr.status+" "+xhr.statusText}}));
					$this[callback](xhr, false);
				}
			}).done(function(json) {
				
				if(json.status != 200){
						if(json.error)
							document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: json.message}}));
						else
							$this[callback](json, false, params);
							
						return;
				}
				$this[callback](json, true, params);
			});
	}
	
	
	set_restore_script_url(url)
	{
		this.restore_script_url = url;
	}
	
	set_current_step(id)
	{
		this.set_current_step = id;
	}
	
	set_cancel(status)
	{
		if(status)
		{
			//document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {append : true, message: "Cancelled" }}));
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 0, class: 'determinate' }}));

		}
			
		this.cancel = status
	}
	
	get_cancel(status)
	{
		return this.cancel
	}
	
	getSize(bytes, conv = 1024*1024)
	{
		return (bytes/conv).toFixed(2);
	}
	
	
}

jQuery(document).ready(function(){
	
	if(xcloner_auth_key === undefined)
		var xcloner_auth_key = "";
	
	var xcloner_restore = new Xcloner_Restore(xcloner_auth_key);
	
	xcloner_restore.set_current_step(0);
	
	jQuery('select').material_select();
	
	jQuery(".xcloner-restore .upload-backup.cancel").on("click", function(){
		//jQuery(".xcloner-restore #upload_backup").show();
		//jQuery(this).hide();
		xcloner_restore.set_cancel(true);
	})
	
	jQuery(".xcloner-restore .upload-backup").on("click",function(){
		
		if(jQuery(this).hasClass('cancel'))
			xcloner_restore.set_cancel(true);
		else
			xcloner_restore.set_cancel(false);
		
		var backup_file = jQuery(".xcloner-restore #backup_file").val();

		if(backup_file)
		{
			jQuery(this).parent().toggleClass("cancel")
			
			if(!xcloner_restore.get_cancel())
				xcloner_restore.upload_backup_file(backup_file);
		}else{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: "Please select a backup file from the list above" }}));

		}
	})
	
	jQuery(".xcloner-restore #validate_url").on("click", function(){
		
		xcloner_restore.set_restore_script_url(jQuery(".xcloner-restore #restore_script_url").val());
		xcloner_restore.verify_restore_url();	
			
	})
	
	jQuery(".xcloner-restore #skip_upload_backup").on("click", function(){
		
		xcloner_restore.set_cancel(true);
		xcloner_restore.next_step();
			
	})
	
	jQuery(".xcloner-restore #skip_restore_remote_database_step").on("click", function(){
		
		xcloner_restore.set_cancel(true);
		xcloner_restore.next_step();
			
	})
	
	jQuery(".xcloner-restore li.steps").on("click", function(){
		xcloner_restore.set_current_step = (jQuery(this).attr("data-step")-1)
	})
	
	jQuery(".xcloner-restore #skip_remote_backup_step").on("click", function(){
		xcloner_restore.set_cancel(true);
		xcloner_restore.next_step();
	})
	
	jQuery(".xcloner-restore .restore-remote-backup-step .collapsible-header").click(function(){
		xcloner_restore.get_remote_backup_files();
	})
	
	jQuery(".xcloner-restore .restore-remote-database-step .collapsible-header").click(function(){
		xcloner_restore.get_remote_mysqldump_files();
	})
	
	jQuery(".xcloner-restore #remote_backup_file").on("change", function(){
		xcloner_restore.init_resume()
	})
	
	jQuery(".xcloner-restore #backup_file").on("change", function(){
		xcloner_restore.init_resume()
	})
	
	jQuery(".xcloner-restore #restore_finish").click(function(){
		xcloner_restore.restore_finish();
	})
	
	jQuery(".xcloner-restore #refresh_remote_backup_file").on("click", function(e){
		xcloner_restore.get_remote_backup_files();
		e.stopPropagation();
	})
	
	jQuery(".xcloner-restore #refresh_database_file").on("click", function(e){
		xcloner_restore.get_remote_mysqldump_files();
		e.stopPropagation();
	})
	
	jQuery(".xcloner-restore .restore_remote_mysqldump").on("click", function(e){
		if(jQuery(this).hasClass('cancel'))
			xcloner_restore.set_cancel(true);
		else
			xcloner_restore.set_cancel(false);
		
		this.remote_database_file = jQuery(".xcloner-restore #remote_database_file").val();
			
		if(!this.remote_database_file)
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: "Please select a mysqld backup file from the list" }}));
			return;
		}	
		
		jQuery(this).parent().toggleClass("cancel")
			
		if(!xcloner_restore.get_cancel())
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 0, class: 'determinate' }}));
			xcloner_restore.remote_restore_mysql_backup_file(this.remote_database_file);
		}
		
	})
	
	jQuery(".xcloner-restore .restore-remote-backup-step .restore_remote_backup").click(function(){
		if(jQuery(this).hasClass('cancel'))
			xcloner_restore.set_cancel(true);
		else
			xcloner_restore.set_cancel(false);
		
		this.backup_file = jQuery(".xcloner-restore #remote_backup_file").val();
			
		if(!this.backup_file)
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: "Please select a backup file from the list above" }}));
			return;
		}	
		
		this.remote_path = jQuery(".xcloner-restore #remote_restore_path").val();
			
		if(!this.remote_path)
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_display_status_text", {detail: {status: 'error', message: "Please enter the remote restore path" }}));
			return;
		}	
		
		jQuery(this).parent().toggleClass("cancel")
			
		if(!xcloner_restore.get_cancel())
		{
			document.dispatchEvent(new CustomEvent("xcloner_restore_update_progress", {detail: {percent: 0, class: 'indeterminate' }}));
			xcloner_restore.remote_restore_backup_file(this.backup_file, this.remote_path);
		}
			
	})
	
})
