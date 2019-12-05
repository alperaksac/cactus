import glob
import os
import shutil
import cv2

APP_ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')


class ImageHandler(object):

    @staticmethod
    def save_image(img_arr, filename, dataset_id):

        img = cv2.imdecode(img_arr, cv2.IMREAD_COLOR)

        if img is None:
            return 'Not an image data!'

        if len(img.shape) != 3 or img.shape[-1] != 3:
            return 'It is not a RGB image!'

        '''if not session['model'].fileupload_predict(img):
            return jsonify({'result': False, 'error': 'It is not a H&E stained image!'})
        '''
        # write image in original format
        cv2.imwrite(APP_ROOT + '/images/' + dataset_id + '/' + filename, img)

        # write image in jpg for web
        cv2.imwrite(APP_ROOT + '/static/cache/' + filename.split('.')[0] + '.jpg', img,
                    [cv2.IMWRITE_JPEG_PROGRESSIVE, 1, cv2.IMWRITE_JPEG_OPTIMIZE, 1])

        # resize image for thumbnails
        height, width, _ = img.shape
        ratio = float(300) / width
        img = cv2.resize(img, (300, int(round(height * ratio))))

        cv2.imwrite(APP_ROOT + '/static/cache/' + filename.split('.')[0] + '_low.jpg', img,
                    [cv2.IMWRITE_JPEG_PROGRESSIVE, 1, cv2.IMWRITE_JPEG_OPTIMIZE, 1])

        return None

    @staticmethod
    def save_cache(filename, dataset_id):
        img = cv2.imread(APP_ROOT + '/images/' + dataset_id + '/' + filename, cv2.IMREAD_COLOR)

        # write image in jpg for web
        cv2.imwrite(APP_ROOT + '/static/cache/' + filename.split('.')[0] + '.jpg', img,
                    [cv2.IMWRITE_JPEG_PROGRESSIVE, 1, cv2.IMWRITE_JPEG_OPTIMIZE, 1])

        # resize image for thumbnails
        height, width, _ = img.shape
        ratio = float(300) / width
        img = cv2.resize(img, (300, int(round(height * ratio))))

        cv2.imwrite(APP_ROOT + '/static/cache/' + filename.split('.')[0] + '_low.jpg', img,
                    [cv2.IMWRITE_JPEG_PROGRESSIVE, 1, cv2.IMWRITE_JPEG_OPTIMIZE, 1])

    # def getBin(self):
    #     file_names = [os.path.basename(x).split(
    #         '.')[0] for x in glob.glob(APP_ROOT + '/tmp/images/*.tif')]
    #     return file_names

    # def createMask(self, name, points):
    #     img = cv2.imread(APP_ROOT + '/images/' + name + '.tif')
    #     height, width, dim = img.shape
    #     blank_image = np.zeros((height, width, 1), img.dtype)

    #     for p in points:
    #         blank_image[int(round(float(p['y']) * img.shape[0]))][int(round(float(p['x']) * img.shape[1]))] = int(
    #             p['cid'])

    #     if os.path.isfile(APP_ROOT + '/images/masks/' + name + '_cell.tif'):
    #         files = len(
    #             glob.glob(APP_ROOT + '/images/versions/' + name + '_cell_*.tif'))

    #         v = files + 1

    #         shutil.copy2(APP_ROOT + '/images/masks/' + name + '_cell.tif',
    #                      APP_ROOT + '/images/versions/' + name + '_cell_' + str(v) + '.tif')

    #     cv2.imwrite(APP_ROOT + '/images/masks/' +
    #                 name + '_cell.tif', blank_image)

    # def getMask(self, name, mask=None):
    #     # Set up the detector with default parameters.
    #     blob_params = cv2.SimpleBlobDetector_Params()
    #     # Filter by Area.
    #     blob_params.filterByArea = False
    #     # Filter by Circularity
    #     blob_params.filterByCircularity = False
    #     # Filter by Convexity
    #     blob_params.filterByConvexity = False
    #     # Filter by Inertia
    #     blob_params.filterByInertia = False

    #     detector = cv2.SimpleBlobDetector_create(blob_params)

    #     if mask is None:
    #         mask = cv2.imread(APP_ROOT + '/images/masks/' +
    #                           name + '_cell.tif', 0)
    #     points = {}

    #     for i in range(1, 8):
    #         blank_image = np.zeros(mask.shape, mask.dtype)
    #         blank_image[mask == i] = 255
    #         blank_image = cv2.bitwise_not(blank_image)

    #         # Detect blobs.
    #         keypoints = detector.detect(blank_image)
    #         points[i] = [(k.pt[0], k.pt[1]) for k in keypoints]

    #     return points

    # def getVersion(self, name, ver):
    #     points = []
    #     if ver != 0:
    #         if os.path.isfile(APP_ROOT + '/images/versions/' + name + '_cell_' + str(ver) + '.tif'):
    #             mask = cv2.imread(APP_ROOT + '/images/versions/' +
    #                               name + '_cell_' + str(ver) + '.tif', 0)
    #             points = self.getMask(name, mask)
    #     else:
    #         mask = cv2.imread(APP_ROOT + '/images/masks/' +
    #                           name + '_cell.tif', 0)
    #         points = self.getMask(name, mask)

    #     return points

    # def getVersionCount(self, name):
    #     return len([os.path.basename(x) for x in glob.glob(APP_ROOT + '/images/versions/' + name + '_cell_*.tif')])

    # def move(self, name, src, dst):
    #     # move image file
    #     shutil.move(APP_ROOT + src + '/images/' + name + '.tif',
    #                 APP_ROOT + dst + '/images/' + name + '.tif')
    #     # move mask
    #     if os.path.isfile(APP_ROOT + src + '/images/masks/' + name + '_cell.tif'):
    #         shutil.move(APP_ROOT + src + '/images/masks/' + name + '_cell.tif',
    #                     APP_ROOT + dst + '/images/masks/' + name + '_cell.tif')
    #     # move versions
    #     for f in glob.glob(APP_ROOT + src + '/images/versions/' + name + '_cell_*.tif'):
    #         shutil.move(f, APP_ROOT + dst +
    #                     '/images/versions/' + os.path.basename(f))
    #     # move annotation
    #     if os.path.isfile(APP_ROOT + src + '/annotations/' + name + '.json'):
    #         shutil.move(APP_ROOT + src + '/annotations/' + name + '.json',
    #                     APP_ROOT + dst + '/annotations/' + name + '.json')
    #     # move score
    #     for f in glob.glob(APP_ROOT + src + '/scores/' + name + '*.json'):
    #         shutil.move(f, APP_ROOT + dst + '/scores/' + os.path.basename(f))

    # def delete(self, name):
    #     # remove image file
    #     os.remove(APP_ROOT + '/tmp/images/' + name + '.tif')
    #     # remove mask
    #     if os.path.isfile(APP_ROOT + '/tmp/images/masks/' + name + '_cell.tif'):
    #         os.remove(APP_ROOT + '/tmp/images/masks/' + name + '_cell.tif')
    #     # remove versions
    #     for f in glob.glob(APP_ROOT + '/tmp/images/versions/' + name + '_cell_*.tif'):
    #         os.remove(f)
    #     # remove annotation
    #     if os.path.isfile(APP_ROOT + '/tmp/annotations/' + name + '.json'):
    #         os.remove(APP_ROOT + '/tmp/annotations/' + name + '.json')
    #     # remove score
    #     for f in glob.glob(APP_ROOT + '/tmp/scores/' + name + '*.json'):
    #         os.remove(f)

    # def deleteAll(self):
    #     file_names = self.getBin()
    #     for name in file_names:
    #         self.delete(name)

    # def restoreAll(self, src, dst):
    #     file_names = self.getBin()
    #     for name in file_names:
    #         self.move(name, src, dst)

    # def getModel(self, name, newOld):

    #     m = Model()

    #     # Set up the detector with default parameters.
    #     blob_params = cv2.SimpleBlobDetector_Params()
    #     # Filter by Area.
    #     blob_params.filterByArea = False
    #     # Filter by Circularity
    #     blob_params.filterByCircularity = False
    #     # Filter by Convexity
    #     blob_params.filterByConvexity = False
    #     # Filter by Inertia
    #     blob_params.filterByInertia = False

    #     detector = cv2.SimpleBlobDetector_create(blob_params)

    #     # mask = cv2.imread(APP_ROOT + '/images/models/' + name + '.tif', 0)
    #     if newOld:
    #         mask = m.predict_new(name)
    #     else:
    #         mask = m.predictt(name)
    #     points = []

    #     for i in range(0, 8):
    #         points.append([])

    #     # normalized = cv2.equalizeHist(mask)

    #     blur = cv2.GaussianBlur(mask, (5, 5), 0)
    #     ret3, thresh = cv2.threshold(
    #         blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    #     # noise removal
    #     kernel = np.ones((3, 3), np.uint8)
    #     opening = cv2.morphologyEx(
    #         thresh, cv2.MORPH_OPEN, kernel, iterations=2)

    #     # sure background area
    #     # sure_bg = cv2.dilate(opening, kernel, iterations=3)

    #     # Finding sure foreground area
    #     # dist_transform = cv2.distanceTransform(opening, cv2.DIST_L2, 3)
    #     # ret, sure_fg = cv2.threshold(dist_transform, 0.3 * dist_transform.max(), 255, 0)

    #     # plt.figure()
    #     # plt.imshow(thresh)
    #     # plt.show()

    #     # Finding unknown region
    #     # sure_fg = np.uint8(sure_fg)
    #     # unknown = cv2.subtract(sure_bg, sure_fg)

    #     # Detect blobs.
    #     im2, contours, hierarchy = cv2.findContours(
    #         opening, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    #     for c in contours:
    #         # compute the center of the contour
    #         M = cv2.moments(c)
    #         cX = int(M["m10"] / M["m00"])
    #         cY = int(M["m01"] / M["m00"])

    #         points[3].append((cX, cY))

    #     return points
