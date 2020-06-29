/* eslint-disable no-unreachable */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-empty */
/* eslint-disable no-plusplus */
/* eslint-disable no-fallthrough */
/* eslint-disable eqeqeq */
/* eslint-disable no-lonely-if */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable prefer-destructuring */
/* eslint-disable consistent-return */
/* eslint-disable default-case */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/camelcase */
/* eslint-disable @typescript-eslint/explicit-function-return-type */

import { Component } from 'angular-ts-decorators';
import { autobind } from 'core-decorators';
import DOMPurify from 'dompurify';
import marked from 'marked';
import QRCode from 'qrcode-svg';
import _ from 'underscore';
import Globals from '../shared/globals';
import StoreService from '../shared/store.service';
import UtilityService from '../shared/utility.service';
import Platform from '../shared/platform.interface';
import BookmarkService from '../shared/bookmark.service.js';
import ApiService from '../shared/api.service.js';
import Strings from '../../../res/strings/en.json';

@autobind
@Component({
  controllerAs: 'vm',
  selector: 'app',
  template: require('./app.component.html')
})
export default class AppComponent {
  $q: ng.IQService;
  $timeout: ng.ITimeoutService;
  apiSvc: ApiService;
  bookmarkSvc: BookmarkService;
  platformSvc: Platform;
  storeSvc: StoreService;
  utilitySvc: UtilityService;

  alert = {
    show: false,
    title: '',
    message: '',
    type: '',
    display: undefined
  };
  bookmark = {
    active: false,
    addButtonDisabledUntilEditForm: false,
    current: undefined,
    descriptionFieldOriginalHeight: undefined,
    displayUpdateForm: false,
    getTitleForDisplay: undefined,
    originalUrl: undefined,
    tagLookahead: undefined,
    tagText: undefined,
    tagTextMeasure: undefined
  };
  bookmarkForm: any;
  globals = Globals;
  help = {
    currentPage: 0,
    pages: undefined
  };
  login = {
    displayGetSyncIdPanel: true,
    displayOtherSyncsWarning: false,
    displayNewSyncPanel: true,
    displayPasswordConfirmation: false,
    displaySyncConfirmation: false,
    displayUpdateServiceConfirmation: false,
    displayUpdateServicePanel: false,
    displayUpgradeConfirmation: false,
    passwordComplexity: {},
    passwordConfirmation: undefined,
    showPassword: false,
    upgradeConfirmed: false,
    validatingServiceUrl: false
  };
  platformName: any;
  restoreForm: any;
  scanner = {
    invalidSyncId: false,
    lightEnabled: false
  };
  search = {
    batchResultsNum: 10,
    bookmarkTree: undefined,
    cancelGetBookmarksRequest: undefined,
    displayDefaultState: undefined,
    displayFolderView: false,
    execute: undefined,
    getLookaheadTimeout: undefined,
    getSearchResultsTimeout: undefined,
    lastWord: undefined,
    lookahead: undefined,
    query: undefined,
    queryMeasure: undefined,
    results: undefined,
    resultsDisplayed: 10,
    selectedBookmark: undefined,
    scrollDisplayMoreEnabled: true
  };
  settings = {
    backupCompletedMessage: undefined,
    backupFileName: undefined,
    checkForAppUpdates: false,
    darkModeEnabled: false,
    dataToRestore: undefined,
    displayQrPanel: false,
    displayRestoreConfirmation: false,
    displayRestoreForm: false,
    displayRevertConfirmation: false,
    displaySearchBarBeneathResults: false,
    displaySyncBookmarksToolbarConfirmation: false,
    downloadLogCompletedMessage: undefined,
    fileRestoreEnabled: false,
    defaultToFolderView: false,
    getSearchLookaheadDelay: 50,
    getSearchResultsDelay: 250,
    logSize: undefined,
    nextAutoUpdate: undefined,
    readWebsiteDataPermissionsGranted: false,
    restoreCompletedMessage: undefined,
    revertCompleted: false,
    revertConfirmationMessage: undefined,
    revertUnavailable: false,
    savingBackup: false,
    savingLog: false,
    syncBookmarksToolbar: true,
    syncIdCopied: false,
    updatesAvailable: undefined,
    validatingRestoreData: false
  };
  strings = Strings;
  sync = {
    dataSize: undefined,
    dataUsed: undefined,
    enabled: false,
    id: undefined,
    inProgress: false,
    newService: {
      apiVersion: '',
      location: undefined,
      maxSyncSize: 0,
      message: '',
      status: undefined,
      url: undefined
    },
    password: '',
    service: {
      apiVersion: '',
      location: undefined,
      maxSyncSize: 0,
      message: '',
      newServiceUrl: '',
      status: undefined,
      url: undefined
    }
  };
  syncForm: any;
  view = {
    current: undefined,
    change: undefined,
    displayMainView: undefined,
    views: {
      login: 0,
      search: 1,
      bookmark: 2,
      settings: 3,
      help: 4,
      support: 5,
      updated: 6,
      permissions: 7,
      loading: 8,
      scan: 9
    }
  };
  working = {
    displayCancelSyncButton: false,
    message: undefined,
    show: false
  };

  static $inject = [
    '$q',
    '$timeout',
    'ApiService',
    'BookmarkService',
    'PlatformService',
    'StoreService',
    'UtilityService'
  ];
  constructor(
    $q: ng.IQService,
    $timeout: ng.ITimeoutService,
    ApiSvc: ApiService,
    BookmarkSvc: BookmarkService,
    PlatformSvc: Platform,
    StoreSvc: StoreService,
    UtilitySvc: UtilityService
  ) {
    this.$q = $q;
    this.$timeout = $timeout;
    this.apiSvc = ApiSvc;
    this.bookmarkSvc = BookmarkSvc;
    this.platformSvc = PlatformSvc;
    this.storeSvc = StoreSvc;
    this.utilitySvc = UtilitySvc;

    this.bookmarkForm = {};
    this.restoreForm = {};
    this.syncForm = {};

    this.alert.display = this.displayAlert;
    this.bookmark.getTitleForDisplay = this.bookmarkSvc.getBookmarkTitleForDisplay;
    this.search.displayDefaultState = this.displayDefaultSearchState;
    this.search.execute = this.searchBookmarks;
    this.view.change = this.changeView;
    this.view.displayMainView = this.displayMainView;
    this.working.message = this.platformSvc.getConstant(Strings.working_Syncing_Message);

    this.init();
  }

  backupRestoreForm_Backup_Click() {
    this.settings.savingBackup = true;

    this.downloadBackupFile()
      .catch(this.displayAlertErrorHandler)
      .finally(() => {
        this.$timeout(() => {
          this.settings.savingBackup = false;

          // Focus on done button
          if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
            (document.querySelector('.btn-done') as HTMLButtonElement).focus();
          }
        });
      });
  }

  backupRestoreForm_BackupFile_Change() {
    const fileInput = document.getElementById('backupFile') as HTMLInputElement;

    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      this.settings.backupFileName = file.name;
      const reader = new FileReader();

      reader.onload = ((data) => {
        return (event) => {
          this.$timeout(() => {
            this.settings.dataToRestore = event.target.result;

            // Reset validation interface
            this.backupRestoreForm_DataToRestore_Change();
            this.settings.validatingRestoreData = true;

            // Trigger restore data validation
            this.$timeout(() => {
              this.validateBackupData();
              this.settings.validatingRestoreData = false;
            });
          });
        };
      })(file);

      // Read the backup file data
      reader.readAsText(file);
    }
  }

  backupRestoreForm_ConfirmRestore_Click() {
    if (!this.settings.dataToRestore) {
      // Display alert
      this.alert.display(
        this.platformSvc.getConstant(Strings.error_NoDataToRestore_Title),
        this.platformSvc.getConstant(Strings.error_NoDataToRestore_Message),
        'danger'
      );

      return;
    }

    // Hide restore confirmation
    this.settings.displayRestoreConfirmation = false;
    this.settings.displayRestoreForm = true;

    // Start restore
    this.restoreData(JSON.parse(this.settings.dataToRestore));
  }

  backupRestoreForm_DataToRestore_Change() {
    this.restoreForm.dataToRestore.$setValidity('InvalidData', true);
  }

  backupRestoreForm_DisplayRestoreForm_Click() {
    // Display restore form
    this.settings.backupFileName = null;
    this.settings.restoreCompletedMessage = null;
    this.settings.displayRestoreConfirmation = false;
    this.settings.dataToRestore = '';
    this.settings.displayRestoreForm = true;
    (document.querySelector('#backupFile') as HTMLInputElement).value = null;
    this.restoreForm.dataToRestore.$setValidity('InvalidData', true);

    // Focus on restore textarea
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('#restoreForm textarea') as HTMLTextAreaElement).select();
      });
    }
  }

  backupRestoreForm_Restore_Click() {
    if (!this.validateBackupData()) {
      return;
    }

    // Display restore confirmation
    this.settings.displayRestoreForm = false;
    this.settings.displayRestoreConfirmation = true;

    // Focus on confirm button
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('.btn-confirm-restore') as HTMLButtonElement).focus();
      });
    }
  }

  backupRestoreForm_SelectBackupFile_Click() {
    // Open select file dialog
    (document.querySelector('#backupFile') as HTMLInputElement).click();
  }

  backupRestoreForm_Revert_Click() {
    // Retrieve install backup from local storage
    return this.storeSvc.get(Globals.CacheKeys.InstallBackup).then((installBackup) => {
      this.$timeout(() => {
        if (!installBackup) {
          this.settings.revertUnavailable = true;
          return;
        }

        const installBackupObj = JSON.parse(installBackup);
        if (installBackupObj && installBackupObj.date && installBackupObj.bookmarks) {
          const date = new Date(installBackupObj.date);
          const confirmationMessage = this.platformSvc.getConstant(
            Strings.settings_BackupRestore_Revert_Confirmation_Message.key
          );
          this.settings.revertConfirmationMessage = confirmationMessage.replace('{date}', date.toLocaleDateString());
          this.settings.displayRevertConfirmation = true;
        } else {
          this.settings.revertUnavailable = true;
        }
      });
    });
  }

  backupRestoreForm_ConfirmRevert_Click() {
    // Display loading overlay
    this.platformSvc.interface_Working_Show();

    // Disable sync and restore local bookmarks to installation state
    this.$q
      .all([this.storeSvc.get(Globals.CacheKeys.InstallBackup), this.disableSync()])
      .then((response) => {
        const installBackupObj = JSON.parse(response[0]);
        const installBackupDate = new Date(installBackupObj.date);
        const bookmarksToRestore = installBackupObj.bookmarks;
        this.utilitySvc.logInfo(`Reverting data to installation state from ${installBackupDate.toISOString()}`);

        // Set working message
        this.working.message = this.platformSvc.getConstant(Strings.working_Reverting_Message);

        // Start restore
        return this.queueSync(
          {
            bookmarks: bookmarksToRestore,
            type: Globals.SyncType.Pull
          },
          Globals.Commands.RestoreBookmarks
        );
      })
      .then(() => {
        this.$timeout(() => {
          // Display completed message
          this.settings.displayRevertConfirmation = false;
          this.settings.revertCompleted = true;
        });
      })
      .catch(this.displayAlertErrorHandler)
      .finally(this.platformSvc.interface_Working_Hide);
  }

  backupRestoreForm_CancelRevert_Click() {
    this.settings.displayRevertConfirmation = false;
    this.settings.revertCompleted = false;
    this.settings.revertConfirmationMessage = null;
    this.settings.revertUnavailable = false;
  }

  bookmarkForm_BookmarkDescription_Change() {
    // Limit the bookmark description to the max length
    this.$timeout(() => {
      this.bookmark.current.description = this.utilitySvc.trimToNearestWord(
        this.bookmark.current.description,
        Globals.Bookmarks.DescriptionMaxLength
      );
    });
  }

  bookmarkForm_BookmarkTags_Change(event?) {
    // Get tag text from event data if provided
    if (event && event.data) {
      this.bookmark.tagText = event.data;
    }

    if (!this.bookmark.tagText || !this.bookmark.tagText.trim()) {
      return;
    }

    // Get last word of tag text
    const lastWord = _.last<string>(this.bookmark.tagText.split(',')).trimLeft();

    // Display lookahead if word length exceeds minimum
    if (lastWord && lastWord.length > Globals.LookaheadMinChars) {
      // Get tags lookahead
      this.bookmarkSvc.getLookahead(lastWord.toLowerCase(), null, true, this.bookmark.current.tags).then((results) => {
        if (!results) {
          this.bookmark.tagLookahead = null;
          return;
        }

        let lookahead = results[0];
        const word = results[1];

        if (lookahead && word.toLowerCase() === lastWord.toLowerCase()) {
          // Set lookahead after trimming word
          lookahead = lookahead ? lookahead.substring(word.length) : undefined;
          this.bookmark.tagTextMeasure = this.bookmark.tagText.replace(/\s/g, '&nbsp;');
          this.bookmark.tagLookahead = lookahead.replace(/\s/g, '&nbsp;');
        }
      });
    } else {
      this.bookmark.tagLookahead = null;
    }
  }

  bookmarkForm_BookmarkTags_ClearAll_Click() {
    this.bookmark.current.tags = [];
    this.bookmarkForm.$setDirty();
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      (document.querySelector('input[name="bookmarkTags"]') as HTMLInputElement).focus();
    }
  }

  bookmarkForm_BookmarkTags_Lookahead_Click() {
    this.bookmark.tagText += this.bookmark.tagLookahead.replace(/&nbsp;/g, ' ');
    this.bookmarkForm_CreateTags_Click();
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      (document.querySelector('input[name="bookmarkTags"]') as HTMLInputElement).focus();
    }
  }

  bookmarkForm_BookmarkTags_KeyDown(event) {
    switch (true) {
      // If user pressed Enter
      case event.keyCode === 13:
        // Add new tags
        event.preventDefault();
        this.bookmarkForm_CreateTags_Click();
        break;
      // If user pressed tab or right arrow key and lookahead present
      case (event.keyCode === 9 || event.keyCode === 39) && !!this.bookmark.tagLookahead:
        // Add lookahead to tag text
        event.preventDefault();
        this.bookmark.tagText += this.bookmark.tagLookahead.replace(/&nbsp;/g, ' ');
        this.bookmarkForm_BookmarkTags_Change();
        if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
          (document.querySelector('input[name="bookmarkTags"]') as HTMLInputElement).focus();
        }
        break;
    }
  }

  bookmarkForm_BookmarkUrl_Change() {
    // Reset form if field is invalid
    if (this.bookmarkForm.bookmarkUrl.$invalid) {
      this.bookmarkForm.bookmarkUrl.$setValidity('Exists', true);
    }
  }

  bookmarkForm_CreateBookmark_Click() {
    // Add tags if tag text present
    if (this.bookmark.tagText && this.bookmark.tagText.length > 0) {
      this.bookmarkForm_CreateTags_Click();
    }

    // Clone current bookmark object
    const bookmarkToCreate = this.bookmarkSvc.cleanBookmark(this.bookmark.current);

    // Check for protocol
    if (!new RegExp(Globals.URL.ProtocolRegex).test(bookmarkToCreate.url)) {
      bookmarkToCreate.url = `https://${bookmarkToCreate.url}`;
    }

    // Validate the new bookmark
    this.bookmarkForm_ValidateBookmark(bookmarkToCreate)
      .then((isValid) => {
        if (!isValid) {
          // Bookmark URL exists, display validation error
          this.bookmarkForm.bookmarkUrl.$setValidity('Exists', false);
          return;
        }

        // Display loading overlay
        const loadingTimeout = this.platformSvc.interface_Working_Show();

        // Sync changes
        return this.queueSync({
          type: Globals.SyncType.Both,
          changeInfo: {
            type: Globals.UpdateType.Create,
            bookmark: bookmarkToCreate
          }
        }).then(() => {
          // Set bookmark active status if current bookmark is current page
          return this.platformSvc.getCurrentUrl().then((currentUrl) => {
            // Update bookmark status and switch view
            const bookmarkStatusActive = currentUrl && currentUrl.toUpperCase() === bookmarkToCreate.url.toUpperCase();
            return this.syncBookmarksSuccess(loadingTimeout, bookmarkStatusActive);
          });
        });
      })
      .catch(this.checkIfSyncDataRefreshedOnError);
  }

  bookmarkForm_CreateTags_Click() {
    // Clean and sort tags and add them to tag array
    const newTags = this.utilitySvc.getTagArrayFromText(this.bookmark.tagText);
    this.bookmark.current.tags = _.sortBy(_.union(newTags, this.bookmark.current.tags), (tag) => {
      return tag;
    });

    this.bookmarkForm.$setDirty();
    this.bookmark.tagText = '';
    this.bookmark.tagLookahead = '';
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      (document.querySelector('input[name="bookmarkTags"]') as HTMLInputElement).focus();
    }
  }

  bookmarkForm_DeleteBookmark_Click() {
    const bookmarkToDelete = this.bookmark.current;

    // Display loading overlay
    const loadingTimeout = this.platformSvc.interface_Working_Show();

    // Sync changes
    this.queueSync({
      type: Globals.SyncType.Both,
      changeInfo: {
        type: Globals.UpdateType.Delete,
        id: bookmarkToDelete.id
      }
    })
      .then(() => {
        // Set bookmark active status if current bookmark is current page
        return this.platformSvc.getCurrentUrl();
      })
      .then((currentUrl) => {
        // Update bookmark status and switch view
        const bookmarkStatusActive = !(
          currentUrl && currentUrl.toUpperCase() === this.bookmark.originalUrl.toUpperCase()
        );
        return this.syncBookmarksSuccess(loadingTimeout, bookmarkStatusActive);
      })
      .catch(this.checkIfSyncDataRefreshedOnError);
  }

  bookmarkForm_GetMetadata_Click() {
    this.getMetadataForUrl(this.bookmark.current.url)
      .then((metadata) => {
        if (!metadata || (!metadata.title && !metadata.description && !metadata.tags)) {
          return;
        }

        // Update bookmark metadata and set url field as pristine
        this.bookmark.current.title = metadata.title || this.bookmark.current.title;
        this.bookmark.current.description = metadata.description || this.bookmark.current.description;
        this.bookmark.current.tags = metadata.tags || this.bookmark.current.tags;
        this.bookmarkForm.bookmarkUrl.$setPristine();

        // Display message
        this.displayAlert(null, this.platformSvc.getConstant(Strings.getMetadata_Success_Message));
      })
      .catch(this.displayAlertErrorHandler);
  }

  bookmarkForm_RemoveTag_Click(tag) {
    this.bookmark.current.tags = _.without(this.bookmark.current.tags, tag);
    this.bookmarkForm.$setDirty();
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      (document.querySelector('#bookmarkForm input[name="bookmarkTags"]') as HTMLInputElement).focus();
    }
  }

  bookmarkForm_UpdateBookmark_Click() {
    // Add tags if tag text present
    if (this.bookmark.tagText && this.bookmark.tagText.length > 0) {
      this.bookmarkForm_CreateTags_Click();
    }

    // Clone current bookmark object
    const bookmarkToUpdate = this.bookmarkSvc.cleanBookmark(this.bookmark.current);

    // Check for protocol
    if (!new RegExp(Globals.URL.ProtocolRegex).test(bookmarkToUpdate.url)) {
      bookmarkToUpdate.url = `https://${bookmarkToUpdate.url}`;
    }

    // Validate the new bookmark
    this.bookmarkForm_ValidateBookmark(bookmarkToUpdate, this.bookmark.originalUrl)
      .then((isValid) => {
        if (!isValid) {
          // Bookmark URL exists, display validation error
          this.bookmarkForm.bookmarkUrl.$setValidity('Exists', false);
          return;
        }

        // Display loading overlay
        this.platformSvc.interface_Working_Show();

        // Sync changes
        return this.queueSync({
          type: Globals.SyncType.Both,
          changeInfo: {
            type: Globals.UpdateType.Update,
            bookmark: bookmarkToUpdate
          }
        })
          .then(() => {
            // Set bookmark active status if current bookmark is current page
            return this.platformSvc.getCurrentUrl();
          })
          .then((currentUrl) => {
            if (currentUrl && currentUrl.toUpperCase() === this.bookmark.originalUrl.toUpperCase()) {
              this.bookmark.active = currentUrl && currentUrl.toUpperCase() === bookmarkToUpdate.url.toUpperCase();
            }

            // Display the search panel
            return this.changeView(this.view.views.search);
          });
      })
      .catch(this.checkIfSyncDataRefreshedOnError);
  }

  bookmarkForm_ValidateBookmark(bookmarkToValidate, originalUrl?) {
    // Skip validation if URL is unmodified
    if (originalUrl && bookmarkToValidate.url.toUpperCase() === originalUrl.toUpperCase()) {
      return this.$q.resolve(true);
    }

    // Check if bookmark url already exists
    return this.bookmarkSvc
      .searchBookmarks({
        url: bookmarkToValidate.url
      })
      .then((results) => {
        // Filter search results for bookmarks wuth matching urls
        const duplicateBookmarks = results.filter((b) => {
          return b.url.toUpperCase() === bookmarkToValidate.url.toUpperCase();
        });

        return duplicateBookmarks.length === 0;
      });
  }

  bookmarkPanel_Close_Click() {
    this.view.displayMainView();
  }

  button_ReleaseNotes_Click() {
    const url = Globals.ReleaseNotesUrlStem + this.utilitySvc.getVersionTag();
    this.openUrl(null, url);
    this.view.displayMainView();
  }

  changeView(view, viewData?) {
    let initNewView;

    // Hide loading panel
    this.platformSvc.interface_Working_Hide();

    // Initialise new view
    switch (view) {
      case this.view.views.bookmark:
        initNewView = this.init_bookmarkView(viewData);
        break;
      case this.view.views.search:
        initNewView = this.init_searchView();
        break;
      case this.view.views.settings:
        initNewView = this.init_settingsView();
        break;
      case this.view.views.help:
      case this.view.views.permissions:
      case this.view.views.support:
      case this.view.views.updated:
        initNewView = this.init_infoView();
        break;
      case this.view.views.loading:
        initNewView = this.init_loadingView();
        break;
      case this.view.views.login:
        initNewView = this.init_loginView();
        break;
      default:
        initNewView = this.$q.resolve();
    }

    return initNewView
      .then(() => {
        // Display new view
        this.view.current = view;
      })
      .then(() => {
        // Attach events to new tab links
        this.$timeout(this.setNewTabLinks, 150);
        return view;
      });
  }

  checkIfSyncDataRefreshedOnError(err) {
    // If data out of sync display main view
    return (this.bookmarkSvc.checkIfRefreshSyncedDataOnError(err) ? this.displayMainView() : this.$q.resolve()).then(
      () => {
        this.displayAlertErrorHandler(err);
      }
    );
  }

  convertPageMetadataToBookmark(metadata) {
    if (!metadata) {
      return;
    }

    const metadataAsBookmark = this.bookmarkSvc.xBookmark(
      metadata.title,
      metadata.url,
      this.utilitySvc.trimToNearestWord(metadata.description, Globals.Bookmarks.DescriptionMaxLength),
      this.utilitySvc.getTagArrayFromText(metadata.tags)
    );
    return metadataAsBookmark;
  }

  disableSync() {
    // Disable sync
    return this.platformSvc
      .sync_Disable()
      .then(() => {
        this.sync.dataSize = null;
        this.sync.dataUsed = null;
        this.sync.enabled = false;
        this.sync.password = '';
        this.login.passwordComplexity = {};
      })
      .catch(this.displayAlertErrorHandler);
  }

  displayAlert(title, message, alertType?) {
    this.$timeout(() => {
      this.alert.title = title;
      this.alert.message = message;
      this.alert.type = alertType;
      this.alert.show = true;
    });
  }

  displayAlertErrorHandler(err) {
    this.$timeout(() => {
      const errMessage = this.platformSvc.getErrorMessageFromException(err);
      this.alert.display(errMessage.title, errMessage.message, 'danger');
    });
  }

  displayDefaultSearchState() {
    // Clear search and results
    this.search.query = null;
    this.search.queryMeasure = null;
    this.search.lookahead = null;
    this.search.results = null;

    if (this.search.displayFolderView) {
      // Initialise bookmark tree
      this.search.bookmarkTree = null;
      this.bookmarkSvc
        .getCachedBookmarks()
        .then((results) => {
          this.$timeout(() => {
            // Display bookmark tree view, sort containers
            this.search.bookmarkTree = results.sort((a, b) => {
              return b.title.localeCompare(a.title);
            });
          });
        })
        .catch(this.displayAlertErrorHandler);
    }

    return this.$q.resolve();
  }

  displayHelpPage(panelToDisplay?) {
    if (panelToDisplay < 0 || panelToDisplay >= this.help.pages.length) {
      return this.helpPanel_Close();
    }

    this.help.currentPage = panelToDisplay || 0;
    this.$timeout(() => {
      (document.querySelector('#help-panel .view-content > div') as HTMLDivElement).focus();
    }, 150);
  }

  displayMainView() {
    return this.storeSvc
      .get([
        Globals.CacheKeys.DisplayHelp,
        Globals.CacheKeys.DisplayPermissions,
        Globals.CacheKeys.DisplayUpdated,
        Globals.CacheKeys.SyncEnabled
      ])
      .then((cachedData) => {
        const displayHelp = cachedData[Globals.CacheKeys.DisplayHelp];
        const displayPermissions = cachedData[Globals.CacheKeys.DisplayPermissions];
        const displayUpdated = cachedData[Globals.CacheKeys.DisplayUpdated];
        const syncEnabled = cachedData[Globals.CacheKeys.SyncEnabled];

        switch (true) {
          case displayUpdated:
            return this.changeView(this.view.views.updated);
          case displayPermissions:
            return this.changeView(this.view.views.permissions);
          case displayHelp:
            return this.helpPanel_ShowHelp();
          case syncEnabled:
            return this.changeView(this.view.views.search);
          default:
            return this.changeView(this.view.views.login);
        }
      });
  }

  displayQrPanel() {
    // QR code should encode sync info
    const syncInfo = this.utilitySvc.createSyncInfoObject(this.sync.id, this.sync.service.url);

    // Generate QR code
    const qrcode = new QRCode({
      content: JSON.stringify(syncInfo),
      padding: 4,
      width: 200,
      height: 200,
      color: '#000000',
      background: '#ffffff',
      ecl: 'M'
    });
    const svgString = qrcode
      .svg()
      .replace('width="200" height="200"', 'viewBox="0, 0, 200, 200" preserveAspectRatio="xMidYMid meet"');

    // Add new qr code svg to qr container
    const svg = new DOMParser().parseFromString(svgString, 'text/xml').firstElementChild;
    const qrContainer = document.getElementById('qr');
    while (qrContainer.firstElementChild) {
      qrContainer.removeChild(qrContainer.firstElementChild);
    }
    qrContainer.appendChild(svg);
    this.settings.displayQrPanel = true;
  }

  downloadBackupFile() {
    // Get data for backup
    return this.$q
      .all([
        this.bookmarkSvc.exportBookmarks(),
        this.storeSvc.get([Globals.CacheKeys.SyncEnabled, Globals.CacheKeys.SyncId]),
        this.utilitySvc.getServiceUrl()
      ])
      .then((data) => {
        const bookmarksData = data[0];
        const syncEnabled = data[1][Globals.CacheKeys.SyncEnabled];
        const syncId = data[1][Globals.CacheKeys.SyncId];
        const serviceUrl = data[2];
        const backupData = this.utilitySvc.createBackupData(
          bookmarksData,
          syncEnabled ? syncId : null,
          syncEnabled ? serviceUrl : null
        );

        // Beautify json and download data
        const beautifiedJson = JSON.stringify(backupData, null, 2);
        return this.platformSvc.downloadFile(this.utilitySvc.getBackupFileName(), beautifiedJson, 'backupLink');
      })
      .then((message) => {
        // Display message
        this.settings.backupCompletedMessage = message;
      });
  }

  downloadLogFile() {
    // Get cached message log
    return this.storeSvc
      .get(Globals.CacheKeys.TraceLog)
      .then((debugMessageLog) => {
        // Trigger download
        return this.platformSvc.downloadFile(
          this.utilitySvc.getLogFileName(),
          debugMessageLog.join('\r\n'),
          'downloadLogFileLink'
        );
      })
      .then((message) => {
        // Display message
        this.settings.downloadLogCompletedMessage = message;
      });
  }

  getMetadataForCurrentPage() {
    return this.platformSvc.getPageMetadata(true).then(this.convertPageMetadataToBookmark);
  }

  getMetadataForUrl(url) {
    if (!url) {
      return this.$q.resolve();
    }

    return this.platformSvc.getPageMetadata(true, url).then(this.convertPageMetadataToBookmark);
  }

  getServiceStatusTextFromStatusCode = (statusCode) => {
    if (statusCode == null) {
      return null;
    }

    switch (statusCode) {
      case Globals.ServiceStatus.NoNewSyncs:
        return this.platformSvc.getConstant(Strings.settings_Service_Status_NoNewSyncs);
      case Globals.ServiceStatus.Offline:
        return this.platformSvc.getConstant(Strings.settings_Service_Status_Offline);
      case Globals.ServiceStatus.Online:
        return this.platformSvc.getConstant(Strings.settings_Service_Status_Online);
      case Globals.ServiceStatus.Error:
      default:
        return this.platformSvc.getConstant(Strings.settings_Service_Status_Error);
    }
  };

  init() {
    // Platform-specific initation
    this.platformSvc
      .init(this)
      .then(() => {
        // Get cached prefs from storage
        return this.$q.all([
          this.storeSvc.get([
            Globals.CacheKeys.DarkModeEnabled,
            Globals.CacheKeys.DisplaySearchBarBeneathResults,
            Globals.CacheKeys.DefaultToFolderView,
            Globals.CacheKeys.SyncEnabled,
            Globals.CacheKeys.SyncId
          ]),
          this.utilitySvc.getServiceUrl()
        ]);
      })
      .then((cachedData) => {
        // Set view model values
        this.settings.displaySearchBarBeneathResults = !!cachedData[0][
          Globals.CacheKeys.DisplaySearchBarBeneathResults
        ];
        this.settings.defaultToFolderView = !!cachedData[0][Globals.CacheKeys.DefaultToFolderView];
        this.sync.enabled = !!cachedData[0][Globals.CacheKeys.SyncEnabled];
        this.sync.id = cachedData[0][Globals.CacheKeys.SyncId];
        this.sync.service.url = cachedData[1];
        if (cachedData[0][Globals.CacheKeys.DarkModeEnabled] !== undefined) {
          this.settings.darkModeEnabled = cachedData[0][Globals.CacheKeys.DarkModeEnabled];
        }

        // Check if a sync is currently in progress
        return (
          this.platformSvc
            .sync_Current()
            .then((currentSync) => {
              if (currentSync) {
                this.utilitySvc.logInfo('Waiting for syncs to finish...');

                // Only display cancel button for push syncs
                if (currentSync.type === Globals.SyncType.Push) {
                  this.working.displayCancelSyncButton = true;
                }

                // Display loading panel
                return this.view
                  .change(this.view.views.loading)
                  .then(this.waitForSyncsToFinish)
                  .then(() => {
                    return this.storeSvc.get(Globals.CacheKeys.SyncEnabled);
                  })
                  .then((syncEnabled) => {
                    // Check that user didn't cancel sync
                    this.sync.enabled = syncEnabled;
                    if (this.sync.enabled) {
                      this.utilitySvc.logInfo('Syncs finished, resuming');
                      return this.syncBookmarksSuccess();
                    }
                  })
                  .finally(() => {
                    this.working.displayCancelSyncButton = false;
                  });
              }

              // Return here if view has already been set
              if (this.view.current) {
                return;
              }

              // Set initial view
              return this.displayMainView();
            })
            // Check if current page is a bookmark
            .then(() => {
              return this.setBookmarkStatus();
            })
        );
      })
      .catch((err) => {
        this.displayMainView().then(() => {
          // Display alert
          this.displayAlertErrorHandler(err);
        });
      });
  }

  init_bookmarkView(bookmark) {
    this.bookmark.addButtonDisabledUntilEditForm = false;
    this.bookmark.current = null;
    this.bookmark.displayUpdateForm = false;
    this.bookmark.originalUrl = null;
    this.bookmark.tagLookahead = null;
    this.bookmark.tagText = null;
    this.bookmark.tagTextMeasure = null;

    return this.$q((resolve) => {
      // If bookmark to update provided, set to current and return
      if (bookmark) {
        this.bookmark.displayUpdateForm = true;
        return resolve(bookmark);
      }

      // Check if current url is a bookmark
      return this.bookmarkSvc.findCurrentUrlInBookmarks().then((existingBookmark) => {
        if (existingBookmark) {
          // Display update bookmark form and return
          this.bookmark.displayUpdateForm = true;
          return resolve(existingBookmark);
        }

        resolve();
      });
    })
      .then((bookmarkToUpdate: any) => {
        if (bookmarkToUpdate) {
          // Remove search score and set current bookmark to result
          delete bookmarkToUpdate.score;
          this.bookmark.current = bookmarkToUpdate;
          this.bookmark.originalUrl = bookmarkToUpdate.url;
          return;
        }

        // Set default bookmark form values
        this.bookmark.current = { url: 'https://' };
        this.bookmark.originalUrl = this.bookmark.current.url;

        // Get current page metadata as bookmark
        this.getMetadataForCurrentPage()
          .then((currentPageMetadata) => {
            if (currentPageMetadata) {
              this.bookmark.current = currentPageMetadata;
              this.bookmark.originalUrl = currentPageMetadata.url;
            }
          })
          .catch(this.displayAlertErrorHandler);
      })
      .then(() => {
        this.$timeout(() => {
          // Reset form
          this.bookmarkForm.$setPristine();
          this.bookmarkForm.$setUntouched();

          if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
            // Set initial focus
            const element = document.querySelector('.focused') as HTMLInputElement;
            if (element.select) {
              element.select();
            } else {
              element.focus();
            }
          }
        }, 150);
      })
      .catch((err) => {
        // Set bookmark url
        if (err && err.url) {
          const bookmark = this.bookmarkSvc.xBookmark('', err.url);
          this.bookmark.current = bookmark;
        }

        // Display alert
        this.displayAlertErrorHandler(err);
      });
  }

  init_infoView() {
    this.$timeout(() => {
      // Focus on button
      if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
        const element = document.querySelector('.focused') as HTMLInputElement;
        if (element) {
          element.focus();
        }
      }
    }, 150);

    return this.$q.resolve();
  }

  init_loadingView() {
    this.platformSvc.interface_Working_Show();
    return this.$q.resolve();
  }

  init_loginView() {
    this.login.displayOtherSyncsWarning = false;
    this.login.displayPasswordConfirmation = false;
    this.login.displaySyncConfirmation = false;
    this.login.displayUpdateServiceConfirmation = false;
    this.login.displayUpdateServicePanel = false;
    this.login.displayUpgradeConfirmation = false;
    this.login.passwordComplexity = {};
    this.login.passwordConfirmation = null;
    this.login.showPassword = false;
    this.login.upgradeConfirmed = false;
    this.login.validatingServiceUrl = false;
    this.sync.password = '';

    // Validate sync id if present
    this.$timeout(() => {
      this.syncForm_SyncId_Change();
    }, 150);

    return this.storeSvc.get(Globals.CacheKeys.DisplayOtherSyncsWarning).then((displayOtherSyncsWarning) => {
      if (this.utilitySvc.isMobilePlatform(this.platformName)) {
        // Set displayed panels for mobile platform
        this.login.displayGetSyncIdPanel = !this.sync.id;
        this.login.displayNewSyncPanel = false;
      } else {
        // Set displayed panels for browsers
        this.login.displayNewSyncPanel = !this.sync.id;

        // If not synced before, display warning to disable other sync tools
        if (displayOtherSyncsWarning == null || displayOtherSyncsWarning === true) {
          this.login.displayOtherSyncsWarning = true;

          // Focus on first button
          if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
            this.$timeout(() => {
              (document.querySelector('.otherSyncsWarning .buttons > button') as HTMLButtonElement).focus();
            }, 150);
          }
        } else {
          // Focus on password field
          if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
            this.$timeout(() => {
              (document.querySelector('.active-login-form  input[name="txtPassword"]') as HTMLInputElement).focus();
            }, 150);
          }
        }
      }

      // Refresh service info
      this.refreshServiceStatus();
    });
  }

  init_searchView() {
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        // Focus on search box
        (document.querySelector('input[name=txtSearch]') as HTMLInputElement).focus();
      }, 150);
    }

    // Reset search view
    this.search.displayFolderView = this.settings.defaultToFolderView;
    this.search.bookmarkTree = null;
    this.search.selectedBookmark = null;
    return this.search.displayDefaultState();
  }

  init_settingsView() {
    this.settings.displayQrPanel = false;
    this.settings.displayRestoreConfirmation = false;
    this.settings.displayRestoreForm = false;
    this.settings.displayRevertConfirmation = false;
    this.settings.displaySyncBookmarksToolbarConfirmation = false;
    this.settings.backupFileName = null;
    this.settings.backupCompletedMessage = null;
    this.settings.downloadLogCompletedMessage = null;
    this.settings.readWebsiteDataPermissionsGranted = false;
    this.settings.restoreCompletedMessage = null;
    this.settings.revertCompleted = false;
    this.settings.revertConfirmationMessage = undefined;
    this.settings.revertUnavailable = false;
    this.settings.dataToRestore = '';
    this.settings.savingBackup = false;
    this.settings.savingLog = false;
    this.settings.validatingRestoreData = false;
    this.settings.updatesAvailable = undefined;
    this.settings.nextAutoUpdate = undefined;

    // Get current service url and sync bookmarks toolbar setting from cache
    return this.$q
      .all([
        this.bookmarkSvc.getSyncBookmarksToolbar(),
        this.storeSvc.get([Globals.CacheKeys.CheckForAppUpdates, Globals.CacheKeys.TraceLog]),
        this.utilitySvc.isPlatform(this.platformName, Globals.Platforms.Chrome)
          ? this.platformSvc.permissions_Check()
          : this.$q.resolve(false)
      ])
      .then((data) => {
        const syncBookmarksToolbar = data[0];
        const checkForAppUpdates = data[1][Globals.CacheKeys.CheckForAppUpdates];
        const traceLog = data[1][Globals.CacheKeys.TraceLog];
        const readWebsiteDataPermissionsGranted = data[2];

        this.settings.checkForAppUpdates = checkForAppUpdates;
        this.settings.syncBookmarksToolbar = syncBookmarksToolbar;
        this.settings.readWebsiteDataPermissionsGranted = readWebsiteDataPermissionsGranted;
        this.settings.logSize = new TextEncoder().encode(traceLog).length;

        this.$timeout(() => {
          // Check for available sync updates on non-mobile platforms
          if (this.sync.enabled && !this.utilitySvc.isMobilePlatform(this.platformName)) {
            this.$q
              .all([this.bookmarkSvc.checkForUpdates(), this.platformSvc.automaticUpdates_NextUpdate()])
              .then((data) => {
                if (data[0]) {
                  this.settings.updatesAvailable = true;
                  this.settings.nextAutoUpdate = data[1];
                } else {
                  this.settings.updatesAvailable = false;
                }
              })
              .catch((err) => {
                // Don't display alert if sync failed due to network connection
                if (
                  this.utilitySvc.isNetworkConnectionError(err) ||
                  err.code == Globals.ErrorCodes.InvalidService ||
                  err.code == Globals.ErrorCodes.ServiceOffline
                ) {
                  return;
                }

                // Otherwise display alert
                this.displayAlertErrorHandler(err);
              });
          }

          // Set backup file change event for mobile platforms
          if (this.utilitySvc.isMobilePlatform(this.platformName)) {
            document
              .getElementById('backupFile')
              .addEventListener('change', this.backupRestoreForm_BackupFile_Change, false);
          }

          // Update service status and display info
          this.refreshServiceStatus().then(this.refreshSyncDataUsageMeter);
        }, 150);
      });
  }

  issuesPanel_ClearLog_Click() {
    // Clear trace log
    return this.storeSvc.set(Globals.CacheKeys.TraceLog).then(() => {
      this.$timeout(() => {
        this.settings.logSize = 0;
      });
    });
  }

  issuesPanel_DownloadLogFile_Click() {
    this.settings.savingLog = true;

    this.downloadLogFile()
      .catch(this.displayAlertErrorHandler)
      .finally(() => {
        this.$timeout(() => {
          this.settings.savingLog = false;

          // Focus on done button
          if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
            (document.querySelector('.btn-done') as HTMLButtonElement).focus();
          }
        });
      });
  }

  helpPanel_Close() {
    this.view.displayMainView();
  }

  helpPanel_KeyDown(event) {
    switch (true) {
      // Escape key
      case event.keyCode === 27:
        event.preventDefault();
        this.helpPanel_Close();
        break;
      // Left arrow key
      case event.keyCode === 37:
        event.preventDefault();
        this.displayHelpPage(this.help.currentPage - 1);
        break;
      // Right arrow key
      case event.keyCode === 39:
        event.preventDefault();
        this.displayHelpPage(this.help.currentPage + 1);
        break;
    }
  }

  helpPanel_NextPage() {
    this.displayHelpPage(this.help.currentPage + 1);
  }

  helpPanel_PreviousPage() {
    this.displayHelpPage(this.help.currentPage - 1);
  }

  helpPanel_ShowHelp() {
    this.storeSvc.set(Globals.CacheKeys.DisplayHelp, false);
    this.help.pages = this.platformSvc.getHelpPages();
    this.view.change(this.view.views.help);
    this.displayHelpPage();
  }

  openUrl(event, url) {
    if (event) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.srcEvent) {
        event.srcEvent.stopPropagation();
      }
    }

    if (url) {
      this.platformSvc.openUrl(url);
    } else {
      this.platformSvc.openUrl(event.currentTarget.href);
    }
  }

  permissions_Revoke_Click() {
    this.platformSvc
      .permissions_Remove()
      .then(() => {
        this.settings.readWebsiteDataPermissionsGranted = false;
      })
      .catch(this.displayAlertErrorHandler);
  }

  permissions_Request_Click() {
    this.platformSvc
      .permissions_Request()
      .then((granted) => {
        this.settings.readWebsiteDataPermissionsGranted = granted;
      })
      .catch(this.displayAlertErrorHandler);
  }

  permissionsPanel_RequestPermissions_Click() {
    this.$q
      .all([this.platformSvc.permissions_Request(), this.storeSvc.set(Globals.CacheKeys.DisplayPermissions, false)])
      .finally(this.view.displayMainView);
  }

  qrPanel_Close_Click() {
    this.settings.displayQrPanel = false;
    this.$timeout(() => {
      this.settings.syncIdCopied = false;
    }, 150);
  }

  qrPanel_CopySyncId_Click() {
    this.platformSvc
      .copyToClipboard(this.sync.id)
      .then(() => {
        this.$timeout(() => {
          this.settings.syncIdCopied = true;
        });
      })
      .catch(this.displayAlertErrorHandler);
  }

  queueSync(syncData, command?) {
    command = command || Globals.Commands.SyncBookmarks;
    return this.platformSvc
      .sync_Queue(syncData, command)
      .catch((err) => {
        // If sync was processed but not committed (offline) catch the error but display an alert
        if (err.code === Globals.ErrorCodes.SyncUncommitted) {
          this.$timeout(() => {
            this.displayAlertErrorHandler(err);
          }, 150);
          return;
        }

        throw err;
      })
      .finally(() => {
        // Hide working panel and restore default message
        this.platformSvc.interface_Working_Hide();
        this.$timeout(() => {
          this.working.message = this.platformSvc.getConstant(Strings.working_Syncing_Message);
        }, 1e3);
      });
  }

  refreshServiceStatus(serviceObj?, serviceInfo?) {
    serviceObj = serviceObj || this.sync.service;

    // Clear current status
    serviceObj.status = null;

    // Retrieve service info
    return (serviceInfo ? this.$q.resolve(serviceInfo) : this.apiSvc.checkServiceStatus())
      .then((response) => {
        if (!response) {
          return;
        }

        // Render markdown and add link classes to service message
        let message = response.message ? marked(response.message) : null;
        if (message) {
          const messageDom = new DOMParser().parseFromString(message, 'text/html');
          _.each(messageDom.querySelectorAll('a'), (hyperlink) => {
            hyperlink.className = 'new-tab';
          });
          message = DOMPurify.sanitize(messageDom.body.firstElementChild.innerHTML);
          this.$timeout(this.setNewTabLinks);
        }

        serviceObj.apiVersion = response.version;
        serviceObj.location = response.location;
        serviceObj.maxSyncSize = response.maxSyncSize / 1024;
        serviceObj.message = message;
        serviceObj.status = response.status;
      })
      .catch((err) => {
        if (err && err.code === Globals.ErrorCodes.ServiceOffline) {
          serviceObj.status = Globals.ServiceStatus.Offline;
        } else {
          serviceObj.status = Globals.ServiceStatus.Error;
        }
      });
  }

  refreshSyncDataUsageMeter() {
    return this.storeSvc.get(Globals.CacheKeys.SyncEnabled).then((syncEnabled) => {
      // Return if not synced
      if (!syncEnabled) {
        return;
      }

      // Get  bookmarks sync size and calculate sync data percentage used
      return this.bookmarkSvc
        .getSyncSize()
        .then((bookmarksSyncSize) => {
          this.$timeout(() => {
            this.sync.dataSize = bookmarksSyncSize / 1024;
            this.sync.dataUsed = Math.ceil((this.sync.dataSize / this.sync.service.maxSyncSize) * 150);
          });
        })
        .catch(this.displayAlertErrorHandler);
    });
  }

  restoreBookmarksSuccess() {
    // Update current bookmark status
    return (
      this.setBookmarkStatus()
        // Refresh data usage
        .then(this.refreshSyncDataUsageMeter)
        .then(() => {
          this.settings.displayRestoreForm = false;
          this.settings.dataToRestore = '';
          this.settings.restoreCompletedMessage = this.platformSvc.getConstant(
            Strings.settings_BackupRestore_RestoreSuccess_Message.key
          );

          if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
            this.$timeout(() => {
              (document.querySelector('.btn-done') as HTMLButtonElement).focus();
            });
          } else {
            // Refresh search results
            this.search.query = null;
            this.search.queryMeasure = null;
            this.search.lookahead = null;
            return this.search.execute();
          }
        })
    );
  }

  restoreData(backupData) {
    let bookmarksToRestore;
    let serviceUrl;
    let syncId;
    let syncEnabled;

    this.utilitySvc.logInfo('Restoring data');

    try {
      if (backupData.xbrowsersync) {
        // Get data to restore from v1.5.0 backup
        const data = backupData.xbrowsersync.data;
        const sync = backupData.xbrowsersync.sync;
        bookmarksToRestore = data ? data.bookmarks : null;
        serviceUrl = sync ? sync.url : null;
        syncId = sync ? sync.id : null;
      } else if (backupData.xBrowserSync) {
        // Get data to restore from backups prior to v1.5.0
        bookmarksToRestore = backupData.xBrowserSync.bookmarks;
        syncId = backupData.xBrowserSync.id;
      } else {
        // Data to restore invalid, throw error
        const error = new Error('FailedRestoreData');
        (error as any).code = Globals.ErrorCodes.FailedRestoreData;
        throw error;
      }
    } catch (err) {
      this.utilitySvc.logError(err, 'app.restoreData');
      this.displayAlertErrorHandler(err);
      return;
    }

    // Set working message and display loading overlay
    this.working.message = this.platformSvc.getConstant(Strings.working_Restoring_Message);
    this.platformSvc.interface_Working_Show();

    this.storeSvc
      .get(Globals.CacheKeys.SyncEnabled)
      .then((cachedSyncEnabled) => {
        syncEnabled = cachedSyncEnabled;

        // If synced check service status before starting restore, otherwise restore sync settings
        return syncEnabled
          ? this.apiSvc.checkServiceStatus()
          : this.$q((resolve, reject) => {
              // Clear current password and set sync ID if supplied
              this.sync.password = '';
              this.login.passwordComplexity = {};
              this.$q
                .all([
                  this.storeSvc.set(Globals.CacheKeys.Password),
                  syncId ? this.storeSvc.set(Globals.CacheKeys.SyncId, syncId) : this.$q.resolve(),
                  serviceUrl ? this.updateServiceUrl(serviceUrl) : this.$q.resolve()
                ])
                .then(resolve)
                .catch(reject);
            });
      })
      .then(() => {
        // Return if no bookmarks found
        if (!bookmarksToRestore) {
          return;
        }

        // Start restore
        return this.queueSync(
          {
            bookmarks: bookmarksToRestore,
            type: !syncEnabled ? Globals.SyncType.Pull : Globals.SyncType.Both
          },
          Globals.Commands.RestoreBookmarks
        ).then(this.restoreBookmarksSuccess);
      })
      .catch(this.displayAlertErrorHandler)
      .finally(this.platformSvc.interface_Working_Hide);
  }

  scanPanel_Cancel_Click() {
    this.login.displayGetSyncIdPanel = false;
    this.displayMainView().then(this.platformSvc.scanner_Stop);
  }

  scanPanel_ToggleLight_Click() {
    this.platformSvc
      .scanner_ToggleLight()
      .then((lightEnabled) => {
        this.scanner.lightEnabled = lightEnabled;
      })
      .catch(this.displayAlertErrorHandler);
  }

  searchBookmarks() {
    const queryData = {
      url: undefined,
      keywords: []
    };
    const urlRegex = new RegExp(`^${Globals.URL.ValidUrlRegex}$`, 'i');

    if (this.search.query) {
      // Iterate query words to form query data object
      const queryWords = this.search.query.split(/[\s,]+/);
      _.each<string>(queryWords, (queryWord) => {
        // Add query word as url if query is in url format, otherwise add to keywords
        if (!queryData.url && urlRegex.test(queryWord.trim())) {
          queryData.url = queryWord.trim();
        } else {
          const keyword = queryWord.trim().replace("'", '').replace(/\W$/, '').toLowerCase();
          if (keyword) {
            queryData.keywords.push(queryWord.trim());
          }
        }
      });
    }

    return this.bookmarkSvc
      .searchBookmarks(queryData)
      .then((results) => {
        this.search.scrollDisplayMoreEnabled = false;
        this.search.resultsDisplayed = this.search.batchResultsNum;
        this.search.results = results;

        // Scroll to top of search results
        this.$timeout(() => {
          this.search.scrollDisplayMoreEnabled = true;
          const resultsPanel = document.querySelector('.search-results-panel');
          if (resultsPanel) {
            resultsPanel.scrollTop = 0;
          }
        }, 150);
      })
      .catch((err) => {
        this.search.results = null;
        this.displayAlertErrorHandler(err);
      });
  }

  searchForm_AddBookmark_Click() {
    // Display bookmark panel
    this.changeView(this.view.views.bookmark).then(() => {
      // Disable add bookmark button by default
      this.bookmark.addButtonDisabledUntilEditForm = true;
    });
  }

  searchForm_Clear_Click() {
    this.displayDefaultSearchState().then(() => {
      // Display default search results
      this.searchBookmarks();

      // Focus on search box
      if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
        (document.querySelector('input[name=txtSearch]') as HTMLInputElement).focus();
      }
    });
  }

  searchForm_DeleteBookmark_Click(event, bookmark) {
    if (event) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.srcEvent) {
        event.srcEvent.stopPropagation();
      }
    }

    // Find and remove the deleted bookmark element in the search results
    if (this.search.results && this.search.results.length > 0) {
      const deletedBookmarkIndex = _.findIndex<any>(this.search.results, (result) => {
        return result.id === bookmark.id;
      });
      if (deletedBookmarkIndex >= 0) {
        this.search.results.splice(deletedBookmarkIndex, 1);
      }
    }

    // Find and remove the deleted bookmark element in the bookmark tree
    if (this.search.bookmarkTree && this.search.bookmarkTree.length > 0) {
      // Find parent of bookmark to delete
      let parent;
      let childIndex = -1;
      this.bookmarkSvc.eachBookmark(this.search.bookmarkTree, (current) => {
        if (!current.children || current.children.length === 0) {
          return;
        }

        // Check children for target bookmark
        const index = current.children.findIndex((child) => {
          return child.id === bookmark.id;
        });
        if (index >= 0) {
          parent = current;
          childIndex = index;
        }
      });

      // If target bookmark and parent were found, remove the bookmark
      if (parent && childIndex >= 0) {
        parent.children.splice(childIndex, 1);
      }
    }

    this.$timeout(() => {
      // Display loading overlay
      this.platformSvc.interface_Working_Show();

      // Sync changes
      this.queueSync({
        type: Globals.SyncType.Both,
        changeInfo: {
          type: Globals.UpdateType.Delete,
          id: bookmark.id
        }
      }).catch(this.checkIfSyncDataRefreshedOnError);
    }, 1e3);
  }

  searchForm_SearchText_Autocomplete() {
    this.search.query = `${this.search.query}${this.search.lookahead}`;
    this.searchForm_SearchText_Change();
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('input[name=txtSearch]') as HTMLInputElement).focus();
      });
    }
  }

  searchForm_SearchText_Change(event?) {
    this.alert.show = false;

    // Get query from event data if provided
    if (event && event.data) {
      this.search.query = event.data;
    }

    if (this.search.getSearchResultsTimeout) {
      this.$timeout.cancel(this.search.getSearchResultsTimeout);
      this.search.getSearchResultsTimeout = null;
    }

    // No query, clear results
    if (!this.search.query || !this.search.query.trim()) {
      this.search.displayDefaultState();
      return;
    }

    // Get last word of search query
    const queryWords = this.search.query.split(/[\s]+/);
    const lastWord = _.last<string>(queryWords);
    let getLookahead;

    // Display lookahead if word length exceed minimum
    if (lastWord && lastWord.length > Globals.LookaheadMinChars) {
      // Get lookahead
      getLookahead = this.bookmarkSvc
        .getLookahead(lastWord.toLowerCase(), this.search.results)
        .then((results) => {
          if (!results) {
            this.search.lookahead = null;
            return;
          }

          let lookahead = results[0];
          const word = results[1];

          if (lookahead && word.toLowerCase() === lastWord.toLowerCase()) {
            // Set lookahead after trimming word
            lookahead = lookahead ? lookahead.substring(word.length) : undefined;
            this.search.queryMeasure = this.search.query.replace(/\s/g, '&nbsp;');
            this.search.lookahead = lookahead.replace(/\s/g, '&nbsp;');
          }

          this.search.cancelGetBookmarksRequest = null;
        })
        .then(() => {
          this.search.displayFolderView = false;
          return this.searchBookmarks();
        })
        .catch(this.displayAlertErrorHandler);
    } else {
      this.search.lookahead = null;
    }
  }

  searchForm_SearchText_KeyDown(event) {
    // If user pressed enter and search text present
    if (event.keyCode === 13) {
      (document.activeElement as HTMLInputElement).blur();

      if (this.search.getSearchResultsTimeout) {
        this.$timeout.cancel(this.search.getSearchResultsTimeout);
        this.search.getSearchResultsTimeout = null;
      }

      // Get search results
      this.search.displayFolderView = false;
      this.searchBookmarks();

      // Return focus to search box
      this.$timeout(() => {
        (document.querySelector('input[name=txtSearch]') as HTMLInputElement).focus();
      });

      return;
    }

    // If user pressed down arrow and search results present
    if (event.keyCode === 40 && this.search.results && this.search.results.length > 0) {
      // Focus on first search result
      event.preventDefault();
      (document.querySelector('.search-results-panel .bookmark-list').firstElementChild as HTMLDivElement).focus();
      return;
    }

    // If user pressed tab or right arrow key and lookahead present
    if ((event.keyCode === 9 || event.keyCode === 39) && this.search.lookahead) {
      // Add lookahead to search query
      event.preventDefault();
      this.searchForm_SearchText_Autocomplete();
    }
  }

  searchForm_SearchResult_KeyDown(event) {
    let currentIndex;
    let newIndex;
    let elementToFocus;

    switch (true) {
      // Enter
      case event.keyCode === 13:
        event.target.querySelector('.bookmark-content').click();
        break;
      // Up arrow
      case event.keyCode === 38:
        if (event.target.previousElementSibling) {
          // Focus on previous result
          elementToFocus = event.target.previousElementSibling;
        } else {
          // Focus on search box
          elementToFocus = document.querySelector('input[name=txtSearch]');
        }
        break;
      // Down arrow
      case event.keyCode === 40:
        if (event.target.nextElementSibling) {
          // Focus on next result
          elementToFocus = event.target.nextElementSibling;
        }
        break;
      // Page up
      case event.keyCode === 33:
        // Focus on result 10 up from current
        currentIndex = _.indexOf(event.target.parentElement.children, event.target);
        newIndex = currentIndex - 10;
        if (newIndex < 0) {
          elementToFocus = event.target.parentElement.firstElementChild;
        } else {
          elementToFocus = event.target.parentElement.children[newIndex];
        }
        break;
      // Page down
      case event.keyCode === 34:
        // Focus on result 10 down from current
        currentIndex = _.indexOf(event.target.parentElement.children, event.target);
        newIndex = currentIndex + 10;
        if (event.target.parentElement.children.length <= newIndex) {
          elementToFocus = event.target.parentElement.lastElementChild;
        } else {
          elementToFocus = event.target.parentElement.children[newIndex];
        }
        break;
      // Home
      case event.keyCode === 36:
        // Focus on first result
        elementToFocus = event.target.parentElement.firstElementChild;
        break;
      // End
      case event.keyCode === 35:
        // Focus on last result
        elementToFocus = event.target.parentElement.lastElementChild;
        break;
      // Backspace
      case event.keyCode === 8:
      // Space
      case event.keyCode === 32:
      // Numbers and letters
      case event.keyCode > 47 && event.keyCode < 112:
        // Focus on search box
        elementToFocus = document.querySelector('input[name=txtSearch]');
        break;
    }

    if (elementToFocus) {
      event.preventDefault();
      elementToFocus.focus();
    }
  }

  searchForm_SearchResults_Scroll() {
    if (this.search.results && this.search.results.length > 0 && this.search.scrollDisplayMoreEnabled) {
      // Display next batch of results
      this.search.resultsDisplayed += this.search.batchResultsNum;
      // TODO: is this needed?
      // this.search.results = this.search.results;
    }
  }

  searchForm_SelectBookmark_Press(event, bookmarkId) {
    if (event) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.srcEvent) {
        event.srcEvent.stopPropagation();
      }
    }

    // Display menu for selected bookmark
    this.search.selectedBookmark = bookmarkId;
  }

  searchForm_ShareBookmark_Click(event, bookmarkToShare) {
    if (event) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.srcEvent) {
        event.srcEvent.stopPropagation();
      }
    }

    // Trigger native share functionality
    this.platformSvc.bookmarks_Share(bookmarkToShare);
  }

  searchForm_ToggleBookmark_Click() {
    // Display bookmark panel
    this.changeView(this.view.views.bookmark);
  }

  searchForm_ToggleView_Click() {
    this.search.displayFolderView = !this.search.displayFolderView;
    this.displayDefaultSearchState().then(() => {
      // Display default search results
      if (!this.search.displayFolderView) {
        this.searchBookmarks();
      }

      // Focus on search box
      if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
        (document.querySelector('input[name=txtSearch]') as HTMLInputElement).focus();
      }
    });
  }

  searchForm_UpdateBookmark_Click(event, bookmarkToUpdate) {
    if (event) {
      if (event.preventDefault) {
        event.preventDefault();
      }
      if (event.srcEvent) {
        event.srcEvent.stopPropagation();
      }
    }

    // On mobiles, display bookmark panel with slight delay to avoid focussing on description field
    if (this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        this.changeView(this.view.views.bookmark, bookmarkToUpdate);
      }, 500);
    } else {
      this.changeView(this.view.views.bookmark, bookmarkToUpdate);
    }
  }

  setBookmarkStatus(isActive?) {
    if (isActive !== undefined) {
      this.bookmark.active = isActive;
      return this.$q.resolve();
    }

    return this.storeSvc.get(Globals.CacheKeys.SyncEnabled).then((syncEnabled) => {
      if (!syncEnabled) {
        return;
      }

      // If current page is a bookmark, actvate bookmark icon
      return this.bookmarkSvc
        .findCurrentUrlInBookmarks()
        .then((result) => {
          this.bookmark.active = !!result;
        })
        .catch(this.displayAlertErrorHandler);
    });
  }

  setNewTabLinks() {
    const links = document.querySelectorAll('a.new-tab');
    for (let i = 0; i < links.length; i++) {
      const link = links[i] as any;
      link.onclick = this.openUrl;
    }
  }

  settings_Prefs_CheckForAppUpdates_Click() {
    // Update setting value and store in cache
    const value = !this.settings.checkForAppUpdates;
    this.settings.checkForAppUpdates = value;
    this.storeSvc.set(Globals.CacheKeys.CheckForAppUpdates, value);
  }

  settings_Prefs_DisplaySearchBar_Click() {
    // Update setting value and store in cache
    const value = !this.settings.displaySearchBarBeneathResults;
    this.settings.displaySearchBarBeneathResults = value;
    this.storeSvc.set(Globals.CacheKeys.DisplaySearchBarBeneathResults, value);
  }

  settings_Prefs_EnableDarkMode_Click() {
    // Update setting value and store in cache
    const value = !this.settings.darkModeEnabled;
    this.settings.darkModeEnabled = value;
    this.storeSvc.set(Globals.CacheKeys.DarkModeEnabled, value);
  }

  settings_Prefs_DefaultToFolderView_Click() {
    // Update setting value and store in cache
    const value = !this.settings.defaultToFolderView;
    this.settings.defaultToFolderView = value;
    this.storeSvc.set(Globals.CacheKeys.DefaultToFolderView, value);
  }

  settings_Prefs_SyncBookmarksToolbar_Click() {
    this.settings.syncBookmarksToolbar = !this.settings.syncBookmarksToolbar;

    // If confirmation message is currently displayed, hide it and return
    if (this.settings.displaySyncBookmarksToolbarConfirmation) {
      this.settings.displaySyncBookmarksToolbarConfirmation = false;
      return;
    }

    this.$q
      .all([this.bookmarkSvc.getSyncBookmarksToolbar(), this.storeSvc.get(Globals.CacheKeys.SyncEnabled)])
      .then((cachedData) => {
        const syncBookmarksToolbar = cachedData[0];
        const syncEnabled = cachedData[1];

        // If sync not enabled or user just clicked to disable toolbar sync, update stored value and return
        if (!syncEnabled || syncBookmarksToolbar) {
          this.utilitySvc.logInfo(`Toolbar sync ${!syncBookmarksToolbar ? 'enabled' : 'disabled'}`);
          return this.storeSvc.set(Globals.CacheKeys.SyncBookmarksToolbar, !syncBookmarksToolbar);
        }

        // Otherwise, display sync confirmation
        this.settings.displaySyncBookmarksToolbarConfirmation = true;
        this.$timeout(() => {
          (document.querySelector('.btn-confirm-sync-toolbar') as HTMLButtonElement).focus();
        });
      });
  }

  settings_Prefs_SyncBookmarksToolbar_Cancel() {
    this.settings.displaySyncBookmarksToolbarConfirmation = false;
    this.settings.syncBookmarksToolbar = false;
  }

  settings_Prefs_SyncBookmarksToolbar_Confirm() {
    let syncId;

    this.storeSvc
      .get([Globals.CacheKeys.SyncEnabled, Globals.CacheKeys.SyncId])
      .then((cachedData) => {
        const syncEnabled = cachedData[Globals.CacheKeys.SyncEnabled];
        syncId = cachedData[Globals.CacheKeys.SyncId];

        // If sync not enabled, return
        if (!syncEnabled) {
          return;
        }

        // Hide sync confirmation and display loading overlay
        this.settings.displaySyncBookmarksToolbarConfirmation = false;
        this.platformSvc.interface_Working_Show();

        // Enable setting in cache
        return this.storeSvc.set(Globals.CacheKeys.SyncBookmarksToolbar, true);
      })
      .then(() => {
        this.utilitySvc.logInfo('Toolbar sync enabled');

        // Queue sync with no callback action
        return this.queueSync({
          type: !syncId ? Globals.SyncType.Push : Globals.SyncType.Pull
        }).catch(this.displayAlertErrorHandler);
      });
  }

  startSyncing() {
    const syncData = {} as any;
    let syncInfoMessage;

    // Display loading panel
    this.login.displaySyncConfirmation = false;
    this.login.displayOtherSyncsWarning = false;
    this.login.displayUpgradeConfirmation = false;
    const loadingTimeout = this.platformSvc.interface_Working_Show();

    // Check service status
    this.apiSvc
      .checkServiceStatus()
      .then(() => {
        // Clear the current cached password
        return this.storeSvc.set(Globals.CacheKeys.Password);
      })
      .then(() => {
        // If a sync ID has not been supplied, get a new one
        if (!this.sync.id) {
          // Set sync type for create new sync
          syncData.type = Globals.SyncType.Push;

          // Get new sync ID
          return this.apiSvc.createNewSync().then((newSync) => {
            syncInfoMessage = `New sync id created: ${newSync.id}`;

            // Add sync data to cache and return
            return this.$q
              .all([
                this.storeSvc.set(Globals.CacheKeys.LastUpdated, newSync.lastUpdated),
                this.storeSvc.set(Globals.CacheKeys.SyncId, newSync.id),
                this.storeSvc.set(Globals.CacheKeys.SyncVersion, newSync.version)
              ])
              .then(() => {
                return newSync.id;
              });
          });
        }

        syncInfoMessage = `Synced to existing id: ${this.sync.id}`;

        // Set sync type for retrieve existing sync
        syncData.type = Globals.SyncType.Pull;

        // Retrieve sync version for existing id
        return this.apiSvc.getBookmarksVersion(this.sync.id).then((response) => {
          // If no sync version is set, confirm upgrade
          if (!response.version) {
            if (this.login.upgradeConfirmed) {
              syncData.type = Globals.SyncType.Upgrade;
            } else {
              this.login.displayUpgradeConfirmation = true;
              return;
            }
          }

          // Add sync version to cache and return current sync ID
          return this.$q
            .all([
              this.storeSvc.set(Globals.CacheKeys.SyncId, this.sync.id),
              this.storeSvc.set(Globals.CacheKeys.SyncVersion, response.version)
            ])
            .then(() => {
              return this.sync.id;
            });
        });
      })
      .then((syncId) => {
        if (!syncId) {
          return;
        }

        // Generate a password hash, cache it then queue the sync
        return this.utilitySvc
          .getPasswordHash(this.sync.password, syncId)
          .then((passwordHash) => {
            this.storeSvc.set(Globals.CacheKeys.Password, passwordHash);
            return this.queueSync(syncData);
          })
          .then(() => {
            this.utilitySvc.logInfo(syncInfoMessage);
            return this.syncBookmarksSuccess(loadingTimeout);
          })
          .then(() => {
            this.sync.enabled = true;
            this.sync.id = syncId;
          })
          .catch((err) => {
            return this.syncBookmarksFailed(err, syncData);
          });
      })
      .catch((err) => {
        // Disable upgrade confirmed flag
        this.login.upgradeConfirmed = false;

        // Display alert
        this.displayAlertErrorHandler(err);
      })
      .finally(() => {
        // Hide loading panel
        this.platformSvc.interface_Working_Hide(null, loadingTimeout);
      });
  }

  syncBookmarksFailed(err, syncData) {
    // Disable upgrade confirmed flag
    this.login.upgradeConfirmed = false;

    // Clear cached data
    const keys = [Globals.CacheKeys.Bookmarks, Globals.CacheKeys.Password, Globals.CacheKeys.SyncVersion];
    // If error occurred whilst creating new sync, remove cached sync ID and password
    if (syncData.type === Globals.SyncType.Push) {
      keys.push(Globals.CacheKeys.SyncId);
    }
    this.storeSvc.set(keys);

    // If ID was removed disable sync and display login panel
    if (err && err.code === Globals.ErrorCodes.SyncRemoved) {
      return this.changeView(this.view.views.login).finally(() => {
        // Display alert
        this.displayAlertErrorHandler(err);
      });
    }

    // Display alert
    this.displayAlertErrorHandler(err);

    // If creds were incorrect, focus on password field
    if (err.code === Globals.ErrorCodes.InvalidCredentials && !this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('.login-form-existing input[name="txtPassword"]') as HTMLInputElement).select();
      }, 150);
    }
  }

  syncBookmarksSuccess(loadingTimeout?, bookmarkStatusActive?) {
    // Hide loading panel
    this.platformSvc.interface_Working_Hide(null, loadingTimeout);

    // If initial sync, switch to search panel
    this.$timeout(() => {
      if (this.view.current !== this.view.views.search) {
        return this.changeView(this.view.views.search);
      }

      this.search.displayDefaultState();
    }, 150);

    // Update bookmark icon
    return this.setBookmarkStatus(bookmarkStatusActive);
  }

  syncForm_ConfirmPassword_Back_Click() {
    this.login.displayPasswordConfirmation = false;
    this.login.passwordConfirmation = null;
  }

  syncForm_ConfirmPassword_Click() {
    this.login.displayPasswordConfirmation = true;

    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('input[name="txtPasswordConfirmation"]') as HTMLInputElement).focus();
      }, 150);
    }
  }

  syncForm_DisableSync_Click() {
    // Disable sync and switch to login panel
    this.$q.all([this.disableSync(), this.changeView(this.view.views.login)]).catch(this.displayAlertErrorHandler);
  }

  syncForm_EnableSync_Click() {
    if (this.sync.id && this.platformSvc.sync_DisplayConfirmation()) {
      // Display overwrite data confirmation panel
      this.login.displaySyncConfirmation = true;
      if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
        this.$timeout(() => {
          (document.querySelector('.btn-confirm-enable-sync') as HTMLInputElement).focus();
        });
      }
    } else {
      // If no ID provided start syncing
      this.startSyncing();
    }
  }

  syncForm_ExistingSync_Click() {
    this.login.displayNewSyncPanel = false;
    this.sync.password = '';

    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('input[name="txtId"]') as HTMLInputElement).focus();
      }, 150);
    }
  }

  syncForm_ManualEntry_Click() {
    this.login.displayGetSyncIdPanel = false;
  }

  syncForm_NewSync_Click() {
    this.login.displayNewSyncPanel = true;
    this.login.displayPasswordConfirmation = false;
    this.storeSvc.set(Globals.CacheKeys.SyncId);
    this.storeSvc.set(Globals.CacheKeys.Password);
    this.sync.id = null;
    this.sync.password = '';
    this.syncForm.txtId.$setValidity('InvalidSyncId', true);
    this.login.passwordConfirmation = null;
    this.login.passwordComplexity = {};

    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('.login-form-new input[name="txtPassword"]') as HTMLInputElement).focus();
      }, 150);
    }
  }

  syncForm_OtherSyncsDisabled_Click() {
    // Hide disable other syncs warning panel and update cache setting
    this.login.displayOtherSyncsWarning = false;
    this.storeSvc.set(Globals.CacheKeys.DisplayOtherSyncsWarning, false);

    // Focus on password field
    if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
      this.$timeout(() => {
        (document.querySelector('.active-login-form input[name="txtPassword"]') as HTMLInputElement).focus();
      }, 150);
    }
  }

  syncForm_ScanCode_Click() {
    let scanSuccess = false;

    this.platformSvc
      .scanner_Start()
      .then((scannedSyncInfo) => {
        // Update stored sync id and service values
        scanSuccess = true;
        this.sync.id = scannedSyncInfo.id;
        return this.$q.all([
          this.storeSvc.set(Globals.CacheKeys.SyncId, scannedSyncInfo.id),
          this.updateServiceUrl(scannedSyncInfo.url)
        ]);
      })
      .catch(this.displayAlertErrorHandler)
      .finally(() => {
        this.displayMainView().then(() => {
          // Stop scanning
          this.platformSvc.scanner_Stop();

          // If ID was scanned focus on password field
          if (scanSuccess) {
            this.$timeout(() => {
              (document.querySelector('.active-login-form  input[name="txtPassword"]') as HTMLInputElement).focus();
            });
          }
        });
      });
  }

  syncForm_ShowPassword_Click() {
    // Toggle show password
    this.login.showPassword = !this.login.showPassword;
  }

  syncForm_Submit_Click() {
    this.$timeout(() => {
      // Handle enter key press
      if (this.login.displayUpdateServicePanel) {
        (document.querySelector('.update-service-panel .btn-update-service-url') as HTMLButtonElement).click();
      } else if (this.login.displayNewSyncPanel) {
        if (this.login.displayPasswordConfirmation) {
          (document.querySelector('.login-form-new .btn-new-sync') as HTMLButtonElement).click();
        } else {
          (document.querySelector('.login-form-new .btn-confirm-password') as HTMLButtonElement).click();
        }
      } else {
        (document.querySelector('.login-form-existing .btn-existing-sync') as HTMLButtonElement).click();
      }
    });
  }

  syncForm_SyncId_Change() {
    if (!this.sync.id || this.utilitySvc.syncIdIsValid(this.sync.id)) {
      this.syncForm.txtId.$setValidity('InvalidSyncId', true);
      this.storeSvc.set(Globals.CacheKeys.SyncId, this.sync.id);
    } else {
      this.syncForm.txtId.$setValidity('InvalidSyncId', false);
    }
  }

  syncForm_SyncUpdates_Click() {
    // Display loading panel
    const loadingTimeout = this.platformSvc.interface_Working_Show();

    // Pull updates
    this.queueSync({ type: Globals.SyncType.Pull })
      .then(() => {
        return this.syncBookmarksSuccess(loadingTimeout);
      })
      .catch(this.displayAlertErrorHandler);
  }

  syncForm_UpdateService_Cancel_Click() {
    this.login.displayUpdateServiceConfirmation = false;
    this.login.displayUpdateServicePanel = false;
  }

  syncForm_UpdateService_Click() {
    // Reset view
    this.sync.newService.url = this.sync.service.url;
    this.login.displayUpdateServiceConfirmation = false;
    this.login.displayUpdateServicePanel = true;
    this.login.validatingServiceUrl = false;

    // Validate service url
    this.syncForm_UpdateService_ServiceUrl_Validate().finally(() => {
      // Focus on url field
      (document.querySelector('.update-service-panel input') as HTMLInputElement).focus();
    });
  }

  syncForm_UpdateService_Confirm_Click() {
    // Update saved credentials
    const url = this.sync.newService.url.replace(/\/$/, '');
    return this.$q
      .all([
        this.updateServiceUrl(url),
        this.storeSvc.set(Globals.CacheKeys.SyncId),
        this.storeSvc.set(Globals.CacheKeys.Password)
      ])
      .then(() => {
        // Update view
        this.login.displayUpdateServicePanel = false;
        this.login.passwordComplexity = {};
        this.login.passwordConfirmation = null;
        this.sync.id = null;
        this.sync.password = '';
        this.syncForm.txtId.$setValidity('InvalidSyncId', true);
        this.syncForm.$setPristine();
        this.syncForm.$setUntouched();

        // Focus on first field
        if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
          this.$timeout(() => {
            (document.querySelector('.active-login-form input') as HTMLInputElement).focus();
          }, 150);
        }
      })
      .catch((err) => {
        this.utilitySvc.logError(err, 'app.syncForm_UpdateService_Update_Click');
      });
  }

  syncForm_UpdateService_ServiceUrl_Change(event) {
    // Reset form if field is invalid
    if (this.syncForm.newServiceUrl.$invalid) {
      this.syncForm.newServiceUrl.$setValidity('InvalidService', true);
      this.syncForm.newServiceUrl.$setValidity('RequestFailed', true);
      this.syncForm.newServiceUrl.$setValidity('ServiceVersionNotSupported', true);
    }
  }

  syncForm_UpdateService_ServiceUrl_Validate() {
    const timeout = this.$timeout(() => {
      this.login.validatingServiceUrl = true;
    }, 150);

    // Check service url status
    const url = this.sync.newService.url.replace(/\/$/, '');
    return this.apiSvc
      .checkServiceStatus(url)
      .catch((err) => {
        if (err && err.code != null) {
          switch (err.code) {
            case Globals.ErrorCodes.ServiceOffline:
              // If API is offline still allow setting as current service
              return true;
            case Globals.ErrorCodes.UnsupportedServiceApiVersion:
              this.syncForm.newServiceUrl.$setValidity('ServiceVersionNotSupported', false);
              break;
            case Globals.ErrorCodes.InvalidService:
              this.syncForm.newServiceUrl.$setValidity('InvalidService', false);
              break;
            default:
              this.syncForm.newServiceUrl.$setValidity('RequestFailed', false);
          }
        } else {
          this.syncForm.newServiceUrl.$setValidity('RequestFailed', false);
        }

        // Focus on url field
        (document.querySelector('input[name=newServiceUrl]') as HTMLInputElement).focus();
        return false;
      })
      .finally(() => {
        this.$timeout.cancel(timeout);
        this.$timeout(() => {
          this.login.validatingServiceUrl = false;
        });
      });
  }

  syncForm_UpdateService_Update_Click() {
    // Check for protocol
    if (
      this.sync.newService.url &&
      this.sync.newService.url.trim() &&
      !new RegExp(Globals.URL.ProtocolRegex).test(this.sync.newService.url)
    ) {
      this.sync.newService.url = `https://${this.sync.newService.url}`;
    }

    // Validate service url
    return this.syncForm_UpdateService_ServiceUrl_Validate().then((newServiceInfo) => {
      if (!newServiceInfo) {
        return;
      }

      // Retrieve new service status
      return this.refreshServiceStatus(this.sync.newService, newServiceInfo).then(() => {
        // Display confirmation panel
        this.login.displayUpdateServiceConfirmation = true;

        // Focus on first button
        if (!this.utilitySvc.isMobilePlatform(this.platformName)) {
          this.$timeout(() => {
            (document.querySelector('.update-service-panel .confirm .buttons > button') as HTMLButtonElement).focus();
          }, 150);
        }
      });
    });
  }

  syncForm_UpgradeSync_Click() {
    this.login.upgradeConfirmed = true;
    this.startSyncing();
  }

  updatedPanel_Continue_Click() {
    this.storeSvc.set(Globals.CacheKeys.DisplayUpdated, false);
    this.view.change(this.view.views.support);
  }

  updateServiceUrl(url) {
    url = url.replace(/\/$/, '');
    return this.storeSvc
      .set(Globals.CacheKeys.ServiceUrl, url)
      .then(() => {
        this.sync.service.apiVersion = '';
        this.sync.service.location = null;
        this.sync.service.maxSyncSize = 0;
        this.sync.service.message = '';
        this.sync.service.status = null;
        this.sync.service.url = url;
        this.utilitySvc.logInfo(`Service url changed to: ${url}`);

        // Refresh service info
        this.refreshServiceStatus();
      })
      .catch(this.displayAlertErrorHandler);
  }

  validateBackupData() {
    let xBookmarks;
    let restoreData;
    let validateData = false;

    if (!this.settings.dataToRestore) {
      validateData = false;
    }

    // Check backup data structure
    try {
      restoreData = JSON.parse(this.settings.dataToRestore);
      xBookmarks = restoreData.xBrowserSync
        ? restoreData.xBrowserSync.bookmarks
        : restoreData.xbrowsersync && restoreData.xbrowsersync.data
        ? restoreData.xbrowsersync.data.bookmarks
        : null;
      validateData = !!xBookmarks;
    } catch (err) {}
    this.restoreForm.dataToRestore.$setValidity('InvalidData', validateData);

    return validateData;
  }

  waitForSyncsToFinish() {
    const doActionUntil = (currentData) => {
      const currentSync = currentData[0];
      const syncQueueLength = currentData[1];
      return this.$q.resolve(currentSync == null && syncQueueLength === 0);
    };

    const action = () => {
      return this.$q((resolve, reject) => {
        this.$timeout(() => {
          this.$q
            .all([this.platformSvc.sync_Current(), this.platformSvc.sync_GetQueueLength()])
            .then(resolve)
            .catch(reject);
        }, 1e3);
      });
    };

    // Periodically check sync queue until it is empty
    return this.utilitySvc.promiseWhile([], doActionUntil, action);
  }

  workingPanel_Cancel_Click() {
    this.utilitySvc.logInfo('Cancelling sync');

    return this.queueSync({
      type: Globals.SyncType.Cancel
    })
      .then(() => {
        this.sync.enabled = false;
        this.working.displayCancelSyncButton = false;
      })
      .then(this.displayMainView)
      .catch(this.displayAlertErrorHandler);
  }
}